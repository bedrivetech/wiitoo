# syntax=docker/dockerfile:1
# Multi-stage build for the Wiitoo monolith.
# Produces a minimal image (~8MB) with the compiled Go binary.

# ---- Stage 1: Build ----
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build a statically-linked binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o /wiitoo \
    ./cmd/wiitoo/

# ---- Stage 2: Minimal runtime image ----
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

# Create a non-root user
RUN addgroup -S wiitoo && adduser -S wiitoo -G wiitoo

COPY --from=builder /wiitoo /usr/local/bin/wiitoo

USER wiitoo

EXPOSE 8080

ENTRYPOINT ["wiitoo"]