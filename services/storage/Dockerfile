FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git for fetching dependencies
RUN apk add --no-cache git ca-certificates

# Copy module files
COPY services/storage/go.mod services/storage/go.sum* ./services/storage/
COPY pkg/go.mod pkg/go.sum* ./pkg/

# Copy all source
COPY services/storage/ ./services/storage/
COPY pkg/ ./pkg/

# Build
RUN cd services/storage && CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /server /server

EXPOSE 8088

CMD ["/server"]