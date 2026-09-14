#!/bin/sh
set -eu

# PHASE 1 — Platform Core Foundation
# Prisma Foundation → Supabase S1–S6 → Foundation seed → Foundation validate

: "${MIGRATION_DATABASE_URL:?MIGRATION_DATABASE_URL is required}"

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"

# Optional pin check when Supabase CLI is part of the release toolchain.
if [ -n "${SUPABASE_CLI_VERSION:-}" ]; then
  actual_supabase_version="$(supabase --version)"
  if [ "$actual_supabase_version" != "$SUPABASE_CLI_VERSION" ]; then
    echo "Supabase CLI version mismatch: expected $SUPABASE_CLI_VERSION, got $actual_supabase_version" >&2
    exit 1
  fi
fi

echo "=== PHASE 1: Foundation Prisma migrations ==="
DATABASE_URL="$MIGRATION_DATABASE_URL" prisma migrate deploy

echo "=== PHASE 1: Foundation Supabase migrations (S1–S6) ==="
# Applied via ledger-aware SQL runner (not `supabase db push`) so Domain M5 can
# live outside `supabase/migrations/` without breaking idempotent re-runs.
DATABASE_URL="$MIGRATION_DATABASE_URL" \
  MIGRATION_DATABASE_URL="$MIGRATION_DATABASE_URL" \
  node --import tsx "$ROOT_DIR/scripts/deploy/apply-supabase-migrations-dir.ts" \
    "$ROOT_DIR/supabase/migrations"

echo "=== PHASE 1: Foundation seed (roles + Core permissions) ==="
DATABASE_URL="$MIGRATION_DATABASE_URL" npx tsx prisma/seed-foundation.ts

echo "=== PHASE 1: Foundation validation ==="
DATABASE_URL="$MIGRATION_DATABASE_URL" \
  node --import tsx scripts/deploy/validate-database.ts --foundation

echo "Foundation migrate phase complete"
