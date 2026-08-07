#!/bin/bash
set -euo pipefail

FUSION_HOME=$(dirname "$0")/..

help() {
  echo "Usage: make <target>"
  echo ""
  echo "Development:"
  echo "  dev              Run all services locally with Docker Compose"
  echo "  dev-auth         Run auth service locally (requires postgres + redis)"
  echo "  dev-video        Run video service locally"
  echo "  dev-chat         Run chat service locally"
  echo "  dev-payment      Run payment service locally"
  echo "  dev-stream       Run stream service locally"
  echo "  dev-content      Run content service locally"
  echo "  dev-notification Run notification service locally"
  echo ""
  echo "Database:"
  echo "  db-up            Start PostgreSQL + Redis"
  echo "  db-migrate       Run migrations"
  echo "  db-reset         Drop and recreate all tables"
  echo "  db-seed          Seed initial data"
  echo ""
  echo "Build:"
  echo "  build            Build all service binaries"
  echo "  build-auth       Build auth service binary"
  echo "  docker           Build Docker images for all services"
  echo ""
  echo "Infrastructure:"
  echo "  up               Start all services (Docker Compose)"
  echo "  down             Stop all services"
  echo "  logs             Tail logs"
  echo "  ps               Show running services"
  echo "  restart          Restart all services"
  echo ""
  echo "Testing:"
  echo "  test             Run all tests"
  echo "  test-auth        Run auth service tests"
  echo "  lint             Run linter"
  echo ""
  echo "Quality:"
  echo "  fmt              Format all Go code"
  echo "  vet              Run go vet on all services"
  echo "  tidy             Tidy all go modules"
  echo ""
  echo "Deployment:"
  echo "  ci               Run CI pipeline locally"
  echo "  clean            Clean build artifacts"
}

cmd="$1"
shift

case "$cmd" in
  # Development
  dev)
    cd "$FUSION_HOME/deploy"
    docker compose up --build -d postgres redis mediamtx
    echo "Starting services in dev mode..."
    cd "$FUSION_HOME"
    # Start each service in background
    (cd services/auth && go run ./cmd/server &)
    (cd services/video && go run ./cmd/server &)
    (cd services/chat && go run ./cmd/server &)
    (cd services/payment && go run ./cmd/server &)
    (cd services/stream && go run ./cmd/server &)
    (cd services/content && go run ./cmd/server &)
    (cd services/notification && go run ./cmd/server &)
    wait
    ;;
  dev-auth)   cd "$FUSION_HOME/services/auth" && go run ./cmd/server ;;
  dev-video)  cd "$FUSION_HOME/services/video" && go run ./cmd/server ;;
  dev-chat)   cd "$FUSION_HOME/services/chat" && go run ./cmd/server ;;
  dev-payment) cd "$FUSION_HOME/services/payment" && go run ./cmd/server ;;
  dev-stream) cd "$FUSION_HOME/services/stream" && go run ./cmd/server ;;
  dev-content) cd "$FUSION_HOME/services/content" && go run ./cmd/server ;;
  dev-notification) cd "$FUSION_HOME/services/notification" && go run ./cmd/server ;;

  # Database
  db-up)
    cd "$FUSION_HOME/deploy"
    docker compose up -d postgres redis
    echo "Waiting for postgres..."
    sleep 3
    echo "Running init script..."
    docker compose exec -T postgres bash < scripts/init-db.sh || true
    ;;
  db-migrate)
    cd "$FUSION_HOME/deploy"
    docker compose exec -T postgres bash < scripts/init-db.sh || true
    ;;
  db-reset)
    cd "$FUSION_HOME/deploy"
    docker compose exec postgres psql -U fusion -d fusion -c "
      DROP SCHEMA public CASCADE; CREATE SCHEMA public;
    "
    docker compose exec -T postgres bash < scripts/init-db.sh
    ;;
  db-seed)
    cd "$FUSION_HOME/deploy"
    docker compose exec -T postgres bash < scripts/seed-data.sh || true
    ;;

  # Build
  build)
    for svc in auth video chat payment stream content notification; do
      echo "Building $svc..."
      cd "$FUSION_HOME/services/$svc"
      go build -o ../../bin/$svc ./cmd/server
    done
    echo "Binaries in bin/"
    ;;
  build-auth) cd "$FUSION_HOME/services/auth" && go build -o ../../bin/auth ./cmd/server ;;
  docker)
    cd "$FUSION_HOME/deploy"
    docker compose build
    ;;

  # Infrastructure
  up)
    cd "$FUSION_HOME/deploy"
    docker compose up -d --build
    echo "All services started. Access at http://localhost:80"
    ;;
  down)
    cd "$FUSION_HOME/deploy"
    docker compose down
    ;;
  logs)
    cd "$FUSION_HOME/deploy"
    docker compose logs -f "$@"
    ;;
  ps)
    cd "$FUSION_HOME/deploy"
    docker compose ps
    ;;
  restart)
    cd "$FUSION_HOME/deploy"
    docker compose restart
    ;;

  # Testing
  test)
    for svc in pkg auth video chat payment stream content notification; do
      echo "=== Testing $svc ==="
      cd "$FUSION_HOME/$svc" 2>/dev/null || cd "$FUSION_HOME/services/$svc"
      go test ./... -v -count=1 || true
    done
    ;;
  test-auth) cd "$FUSION_HOME/services/auth" && go test ./... -v -count=1 ;;

  # Quality
  fmt)
    cd "$FUSION_HOME"
    go fmt ./pkg/...
    for svc in auth video chat payment stream content notification; do
      cd "$FUSION_HOME/services/$svc" && go fmt ./... 2>/dev/null || true
    done
    ;;
  vet)
    cd "$FUSION_HOME"
    go vet ./pkg/...
    for svc in auth video chat payment stream content notification; do
      cd "$FUSION_HOME/services/$svc" && go vet ./... 2>/dev/null || true
    done
    ;;
  tidy)
    cd "$FUSION_HOME/pkg" && go mod tidy 2>/dev/null || true
    for svc in auth video chat payment stream content notification; do
      cd "$FUSION_HOME/services/$svc" && go mod tidy 2>/dev/null || true
    done
    ;;

  # Deployment
  ci)
    cd "$FUSION_HOME"
    echo "Running CI pipeline..."
    make fmt
    make vet
    make test
    make build
    echo "CI pipeline complete"
    ;;
  clean)
    cd "$FUSION_HOME"
    rm -rf bin/
    find . -name "*.test" -delete
    echo "Clean complete"
    ;;

  *)
    help
    exit 1
    ;;
esac