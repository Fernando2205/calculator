package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculateSuccess(t *testing.T) {
	tests := []struct {
		name      string
		operation string
		body      string
		want      float64
	}{
		{"add", "add", `{"a": 5, "b": 3}`, 8},
		{"subtract", "subtract", `{"a": 5, "b": 3}`, 2},
		{"multiply", "multiply", `{"a": 5, "b": 3}`, 15},
		{"divide", "divide", `{"a": 6, "b": 3}`, 2},
		{"power", "power", `{"a": 2, "b": 10}`, 1024},
		{"percentage", "percentage", `{"a": 20, "b": 150}`, 30},
		{"sqrt", "sqrt", `{"a": 16}`, 4},
		{"zero operands are valid", "add", `{"a": 0, "b": 0}`, 0},
	}

	handler := NewHandler()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/"+tt.operation, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d; body %s", rec.Code, http.StatusOK, rec.Body)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("Content-Type = %q, want %q", ct, "application/json")
			}

			var resp calculationResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("invalid JSON response: %v", err)
			}
			if resp.Operation != tt.operation {
				t.Errorf("operation = %q, want %q", resp.Operation, tt.operation)
			}
			if resp.Result != tt.want {
				t.Errorf("result = %v, want %v", resp.Result, tt.want)
			}
		})
	}
}

func TestCalculateValidationErrors(t *testing.T) {
	tests := []struct {
		name       string
		operation  string
		body       string
		wantStatus int
		wantCode   string
	}{
		{"malformed JSON", "add", `{"a": 5, "b":`, http.StatusBadRequest, "INVALID_JSON"},
		{"empty body", "add", ``, http.StatusBadRequest, "INVALID_JSON"},
		{"operand is a string", "add", `{"a": "5", "b": 3}`, http.StatusBadRequest, "INVALID_JSON"},
		{"unknown field", "add", `{"a": 5, "b": 3, "c": 1}`, http.StatusBadRequest, "INVALID_JSON"},
		{"array instead of object", "add", `[5, 3]`, http.StatusBadRequest, "INVALID_JSON"},
		{"extra data after object", "add", `{"a": 5, "b": 3}{"a": 1}`, http.StatusBadRequest, "INVALID_JSON"},
		{"missing a", "add", `{"b": 3}`, http.StatusBadRequest, "MISSING_OPERAND"},
		{"missing b", "add", `{"a": 5}`, http.StatusBadRequest, "MISSING_OPERAND"},
		{"null operand", "add", `{"a": null, "b": 3}`, http.StatusBadRequest, "MISSING_OPERAND"},
		{"missing a in unary operation", "sqrt", `{}`, http.StatusBadRequest, "MISSING_OPERAND"},
		{"b sent to unary operation", "sqrt", `{"a": 16, "b": 2}`, http.StatusBadRequest, "UNEXPECTED_OPERAND"},
		{"unknown operation", "modulo", `{"a": 5, "b": 3}`, http.StatusNotFound, "UNKNOWN_OPERATION"},
		{"body too large", "add", `{"a": ` + strings.Repeat("1", 2000) + `}`, http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE"},
	}

	handler := NewHandler()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/"+tt.operation, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			assertError(t, rec, tt.wantStatus, tt.wantCode)
		})
	}
}

func TestCalculateMethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/add", nil)
	rec := httptest.NewRecorder()

	NewHandler().ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
	}
}

func TestCalculateDomainErrors(t *testing.T) {
	tests := []struct {
		name      string
		operation string
		body      string
		wantCode  string
	}{
		{"division by zero", "divide", `{"a": 5, "b": 0}`, "DIVISION_BY_ZERO"},
		{"square root of negative number", "sqrt", `{"a": -4}`, "NEGATIVE_SQRT"},
		{"overflow", "multiply", `{"a": 1e308, "b": 10}`, "NON_FINITE_RESULT"},
		{"zero to a negative power", "power", `{"a": 0, "b": -1}`, "NON_FINITE_RESULT"},
	}

	handler := NewHandler()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/"+tt.operation, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			assertError(t, rec, http.StatusUnprocessableEntity, tt.wantCode)
		})
	}
}

func TestCalculateUnexpectedError(t *testing.T) {
	operations["failing"] = operation{apply: func(a, b float64) (float64, error) {
		return 0, errors.New("unexpected failure")
	}}
	t.Cleanup(func() { delete(operations, "failing") })

	req := httptest.NewRequest(http.MethodPost, "/api/v1/failing", strings.NewReader(`{"a": 1, "b": 2}`))
	rec := httptest.NewRecorder()

	NewHandler().ServeHTTP(rec, req)

	assertError(t, rec, http.StatusInternalServerError, "INTERNAL_ERROR")
	if strings.Contains(rec.Body.String(), "unexpected failure") {
		t.Error("response leaks internal error details")
	}
}
func TestHealth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	NewHandler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	var resp map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp["status"] != "ok" {
		t.Errorf(`status field = %q, want "ok"`, resp["status"])
	}
}

// assertError checks that the response is a JSON error with the given status and code.
func assertError(t *testing.T, rec *httptest.ResponseRecorder, wantStatus int, wantCode string) {
	t.Helper()

	if rec.Code != wantStatus {
		t.Fatalf("status = %d, want %d; body: %s", rec.Code, wantStatus, rec.Body)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want %q", ct, "application/json")
	}

	var resp errorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if resp.Error.Code != wantCode {
		t.Errorf("error code = %q, want %q", resp.Error.Code, wantCode)
	}
	if resp.Error.Message == "" {
		t.Error("error message is empty")
	}
}
