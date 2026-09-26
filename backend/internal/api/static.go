package api

import "net/http"

// WithStaticFiles serves the built frontend from dir and forwards API and
// health check requests to api, so both run behind a single origin.
func WithStaticFiles(dir string, api http.Handler) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/api/", api)
	mux.Handle("/healthz", api)
	mux.Handle("/", http.FileServer(http.Dir(dir)))
	return mux
}
