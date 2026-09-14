#!/bin/sh
set -eu

# PHASE 2 — DJ Studio Domain / Product
# Requires Foundation phase complete (OWNER role seeded before M4).
# Domain Prisma M1–M4 → Domain Supabase M5 → Product seed → Product validate

: "${MIGRATION_DATABASE_URL:?MIGRATION_DATABASE_URL is required}"

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"

echo "=== PHASE 2: DJ Studio Prisma migrations (M1–M4) ==="
DATABASE_URL="$MIGRATION_DATABASE_URL" \
  prisma migrate deploy --config "$ROOT_DIR/prisma.dj-studio.config.ts"

echo "=== PHASE 2: DJ Studio Supabase migration (M5) ==="
DATABASE_URL="$MIGRATION_DATABASE_URL" \
  MIGRATION_DATABASE_URL="$MIGRATION_DATABASE_URL" \
  node --import tsx "$ROOT_DIR/scripts/deploy/apply-supabase-migrations-dir.ts" \
    "$ROOT_DIR/supabase/migrations-dj-studio"

echo "=== PHASE 2: Product seed (Foundation + Domain permissions) ==="
DATABASE_URL="$MIGRATION_DATABASE_URL" prisma db seed

echo "=== PHASE 2: Product validation ==="
DATABASE_URL="$MIGRATION_DATABASE_URL" \
  node --import tsx "$ROOT_DIR/scripts/deploy/validate-database.ts" --product

echo "DJ Studio migrate phase complete"
