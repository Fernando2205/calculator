# ---- Build a static Go binary ----
FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

# ---- Runtime: small Alpine image (busybox wget is used by the healthcheck) ----
FROM alpine:3
COPY --from=build /server /usr/local/bin/server
ENV PORT=8080
EXPOSE 8080
USER nobody
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["server"]
