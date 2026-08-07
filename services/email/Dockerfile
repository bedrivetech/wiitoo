FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git for fetching dependencies
RUN apk add --no-cache git ca-certificates

# Copy module files
COPY services/email/go.mod services/email/go.sum* ./services/email/
COPY pkg/go.mod pkg/go.sum* ./pkg/

# Copy all source
COPY services/email/ ./services/email/
COPY pkg/ ./pkg/

# Build
RUN cd services/email && CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /server /server

EXPOSE 8086

CMD ["/server"]