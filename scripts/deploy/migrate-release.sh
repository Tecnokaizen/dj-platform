#!/bin/sh
set -eu

: "${MIGRATION_DATABASE_URL:?MIGRATION_DATABASE_URL is required}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${SUPABASE_CLI_VERSION:?SUPABASE_CLI_VERSION is required}"

actual_supabase_version="$(supabase --version)"
if [ "$actual_supabase_version" != "$SUPABASE_CLI_VERSION" ]; then
  echo "Supabase CLI version mismatch: expected $SUPABASE_CLI_VERSION, got $actual_supabase_version" >&2
  exit 1
fi

DATABASE_URL="$MIGRATION_DATABASE_URL" prisma migrate deploy
supabase db push --db-url "$SUPABASE_DB_URL" --include-all
DATABASE_URL="$MIGRATION_DATABASE_URL" prisma db seed

DATABASE_URL="$MIGRATION_DATABASE_URL" \
  node --import tsx scripts/deploy/validate-database.ts

