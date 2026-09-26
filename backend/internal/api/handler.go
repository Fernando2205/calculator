package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/Fernando2205/calculator/backend/internal/calculator"
)

// maxBodyBytes limits the request body size. Two numbers never need more than this.
const maxBodyBytes = 1 << 10 // 1 KB

// Error codes returned in the "code" field of error responses.
const (
	codeInvalidJSON       = "INVALID_JSON"
	codeMissingOperand    = "MISSING_OPERAND"
	codeUnexpectedOperand = "UNEXPECTED_OPERAND"
	codeUnknownOperation  = "UNKNOWN_OPERATION"
	codePayloadTooLarge   = "PAYLOAD_TOO_LARGE"
	codeDivisionByZero    = "DIVISION_BY_ZERO"
	codeNegativeSqrt      = "NEGATIVE_SQRT"
	codeNonFiniteResult   = "NON_FINITE_RESULT"
	codeInternal          = "INTERNAL_ERROR"
)

type calculationRequest struct {
	A *float64 `json:"a"`
	B *float64 `json:"b"`
}

type calculationResponse struct {
	Operation string  `json:"operation"`
	Result    float64 `json:"result"`
}

// operation adapts a calculator function to a common signature.
// Unary operations ignore the second operand.
type operation struct {
	unary bool
	apply func(a, b float64) (float64, error)
}

type errorResponse struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

var operations = map[string]operation{
	"add":        {apply: calculator.Add},
	"subtract":   {apply: calculator.Subtract},
	"multiply":   {apply: calculator.Multiply},
	"divide":     {apply: calculator.Divide},
	"power":      {apply: calculator.Power},
	"percentage": {apply: calculator.Percentage},
	"sqrt": {unary: true, apply: func(a, _ float64) (float64, error) {
		return calculator.Sqrt(a)
	}},
}

// NewHandler returns the HTTP handler with all API routes registered.
func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/{operation}", handleCalculate)
	return mux
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("operation")
	op, ok := operations[name]
	if !ok {
		writeError(w, http.StatusNotFound, codeUnknownOperation, fmt.Sprintf("unknown operation %q", name))
		return
	}

	req, err := decodeRequest(w, r)
	if err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			writeError(w, http.StatusRequestEntityTooLarge, codePayloadTooLarge,
				fmt.Sprintf("request body must not exceed %d bytes", maxBodyBytes))
			return
		}
		writeError(w, http.StatusBadRequest, codeInvalidJSON,
			`request body must be a JSON object like {"a": 1, "b": 2}`)
		return
	}

	if req.A == nil || (!op.unary && req.B == nil) {
		msg := `operands "a" and "b" are required`
		if op.unary {
			msg = `operand "a" is required`
		}
		writeError(w, http.StatusBadRequest, codeMissingOperand, msg)
		return
	}
	if op.unary && req.B != nil {
		writeError(w, http.StatusBadRequest, codeUnexpectedOperand,
			fmt.Sprintf(`operation %q only accepts operand "a"`, name))
		return
	}

	var b float64
	if !op.unary {
		b = *req.B
	}
	result, err := op.apply(*req.A, b)
	if err != nil {
		code, ok := domainErrorCode(err)
		if !ok {
			writeError(w, http.StatusInternalServerError, codeInternal, "internal server error")
			return
		}
		writeError(w, http.StatusUnprocessableEntity, code, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, calculationResponse{Operation: name, Result: result})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// decodeRequest parses the body as a single JSON object, rejecting unknown
// fields, trailing data and bodies larger than maxBodyBytes.
func decodeRequest(w http.ResponseWriter, r *http.Request) (calculationRequest, error) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	var req calculationRequest
	if err := dec.Decode(&req); err != nil {
		return req, err
	}
	if err := dec.Decode(&struct{}{}); err != io.EOF {
		return req, errors.New("request body must contain a single JSON object")
	}
	return req, nil
}

// domainErrorCode maps a calculator error to its API error code.
// It reports false for errors the API does not know about.
func domainErrorCode(err error) (string, bool) {
	switch {
	case errors.Is(err, calculator.ErrDivisionByZero):
		return codeDivisionByZero, true
	case errors.Is(err, calculator.ErrNegativeSqrt):
		return codeNegativeSqrt, true
	case errors.Is(err, calculator.ErrNonFiniteResult):
		return codeNonFiniteResult, true
	default:
		return "", false
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, errorResponse{Error: errorBody{Code: code, Message: message}})
}
