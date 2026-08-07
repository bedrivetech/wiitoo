# syntax=docker/dockerfile:1
# Multi-stage build for the auth service.
# Produces a minimal image (~8MB) with the compiled Go binary.

# ---- Stage 1: Build ----
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build a statically-linked binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -extldflags=-static" \
    -o /app/auth-server \
    ./cmd/server

# ---- Stage 2: Run ----
FROM scratch

# Copy CA certificates for HTTPS/TLS (needed for OAuth callbacks)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary
COPY --from=builder /app/auth-server /auth-server

# Expose port
EXPOSE 8080

# Run
ENTRYPOINT ["/auth-server"]