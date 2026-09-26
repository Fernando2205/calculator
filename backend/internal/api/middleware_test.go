package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWithCORS(t *testing.T) {
	const origin = "http://localhost:5173"

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	})
	handler := WithCORS(origin, next)

	t.Run("adds CORS headers and calls the next handler", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/add", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusTeapot {
			t.Errorf("status = %d, want %d (next handler not called)", rec.Code, http.StatusTeapot)
		}
		assertCORSHeaders(t, rec, origin)
	})

	t.Run("answers preflight requests without calling the next handler", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/add", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Errorf("status = %d, want %d", rec.Code, http.StatusNoContent)
		}
		assertCORSHeaders(t, rec, origin)
	})
}

func assertCORSHeaders(t *testing.T, rec *httptest.ResponseRecorder, origin string) {
	t.Helper()

	want := map[string]string{
		"Access-Control-Allow-Origin":  origin,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	}
	for header, value := range want {
		if got := rec.Header().Get(header); got != value {
			t.Errorf("%s = %q, want %q", header, got, value)
		}
	}
}
