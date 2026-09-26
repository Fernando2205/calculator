package api

import (
	"encoding/json"
	"net/http"

	"github.com/Fernando2205/calculator/backend/internal/calculator"
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
	op := operations[name]

	var req calculationRequest
	json.NewDecoder(r.Body).Decode(&req)

	var b float64
	if !op.unary {
		b = *req.B
	}
	result, _ := op.apply(*req.A, b)

	writeJSON(w, http.StatusOK, calculationResponse{Operation: name, Result: result})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
