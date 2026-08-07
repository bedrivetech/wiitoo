module github.com/fusion-platform/payment

go 1.23

require (
	github.com/fusion-platform/pkg v0.0.0
	github.com/go-chi/chi/v5 v5.1.0
	github.com/go-chi/cors v1.2.1
	github.com/google/uuid v1.6.0
	github.com/jackc/pgx/v5 v5.7.1
	github.com/redis/go-redis/v9 v9.7.0
	github.com/hibiken/asynq v0.25.1
	github.com/shopspring/decimal v1.4.0
)

replace github.com/fusion-platform/pkg => ../../pkg
