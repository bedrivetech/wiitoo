#!/bin/bash
# Migration runner — uses golang-migrate/migrate to run database migrations.
# Install: https://github.com/golang-migrate/migrate/tree/master/cmd/migrate
#
# Usage:
#   DATABASE_URL="postgres://fusion:fusion@localhost:5432/fusion?sslmode=disable" ./deploy/scripts/migrate.sh up
#   DATABASE_URL="postgres://fusion:fusion@localhost:5432/fusion?sslmode=disable" ./deploy/scripts/migrate.sh down
#   DATABASE_URL="postgres://fusion:fusion@localhost:5432/fusion?sslmode=disable" ./deploy/scripts/migrate.sh create <name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$PROJECT_DIR/deploy/migrations"

# Prefer migrate from PATH, then from common install locations
MIGRATE=""
for candidate in migrate /usr/local/bin/migrate ./migrate; do
  if command -v "$candidate" &>/dev/null; then
    MIGRATE="$candidate"
    break
  fi
done

if [ -z "$MIGRATE" ]; then
  echo "ERROR: golang-migrate (migrate) not found."
  echo "Install: https://github.com/golang-migrate/migrate/tree/master/cmd/migrate"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Example:"
  echo "  DATABASE_URL=\"postgres://fusion:fusion@localhost:5432/fusion?sslmode=disable\" $0 up"
  exit 1
fi

cmd="${1:-help}"

case "$cmd" in
  up)
    echo "Running all migrations up..."
    "$MIGRATE" -path "$MIGRATIONS_DIR" -database "$DATABASE_URL" up
    ;;
  down)
    echo "Rolling back all migrations..."
    "$MIGRATE" -path "$MIGRATIONS_DIR" -database "$DATABASE_URL" down -all
    ;;
  down-one)
    echo "Rolling back one migration..."
    "$MIGRATE" -path "$MIGRATIONS_DIR" -database "$DATABASE_URL" down 1
    ;;
  create)
    name="${2:-}"
    if [ -z "$name" ]; then
      echo "Usage: $0 create <migration_name>"
      exit 1
    fi
    "$MIGRATE" create -ext sql -dir "$MIGRATIONS_DIR" -seq "$name"
    ;;
  version)
    "$MIGRATE" -path "$MIGRATIONS_DIR" -database "$DATABASE_URL" version
    ;;
  goto)
    version="${2:-}"
    if [ -z "$version" ]; then
      echo "Usage: $0 goto <version>"
      exit 1
    fi
    "$MIGRATE" -path "$MIGRATIONS_DIR" -database "$DATABASE_URL" goto "$version"
    ;;
  force)
    version="${2:-}"
    if [ -z "$version" ]; then
      echo "Usage: $0 force <version>"
      exit 1
    fi
    "$MIGRATE" -path "$MIGRATIONS_DIR" -database "$DATABASE_URL" force "$version"
    ;;
  *)
    echo "Usage: DATABASE_URL=... $0 <command>"
    echo ""
    echo "Commands:"
    echo "  up              Apply all pending migrations"
    echo "  down            Roll back all migrations"
    echo "  down-one        Roll back one migration"
    echo "  create <name>   Create a new migration pair"
    echo "  version         Show current migration version"
    echo "  goto <version>  Migrate to a specific version"
    echo "  force <version> Force a dirty migration to a version"
    ;;
esac