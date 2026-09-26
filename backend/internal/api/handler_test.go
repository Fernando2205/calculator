package api

import (
	"encoding/json"
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
			req := httptest.NewRequest(http.MethodPost, "api/v1/"+tt.operation, strings.NewReader(tt.body))
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
