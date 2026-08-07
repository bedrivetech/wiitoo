FROM golang:1.23-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /build

# Copy shared package first (cached layer)
COPY pkg /build/pkg

# Copy service
COPY services/video /build/services/video
COPY go.work /build/go.work

WORKDIR /build/services/video
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /app ./cmd/server

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app /app
EXPOSE 8080
ENTRYPOINT ["/app"]
