package api

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestWithStaticFiles(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<h1>calculator</h1>"), 0o644); err != nil {
		t.Fatal(err)
	}
	handler := WithStaticFiles(dir, NewHandler())

	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		wantStatus int
		wantBody   string
	}{
		{"serves the frontend at the root", http.MethodGet, "/", "", http.StatusOK, "<h1>calculator</h1>"},
		{"serves the API", http.MethodPost, "/api/v1/add", `{"a": 1, "b": 2}`, http.StatusOK, `"result":3`},
		{"serves the health check", http.MethodGet, "/healthz", "", http.StatusOK, `"status":"ok"`},
		{"returns 404 for missing files", http.MethodGet, "/missing.js", "", http.StatusNotFound, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d; body: %s", rec.Code, tt.wantStatus, rec.Body)
			}
			if !strings.Contains(rec.Body.String(), tt.wantBody) {
				t.Errorf("body = %q, want it to contain %q", rec.Body, tt.wantBody)
			}
		})
	}
}
