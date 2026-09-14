#!/bin/sh
set -eu

# Canonical Product release migration runner (phased).
#
# PHASE 0 (caller): bootstrap DB roles — scripts/deploy/bootstrap-postgres-roles.sh
# PHASE 1: Foundation Prisma + Supabase S1–S7 + Foundation seed + validate
# PHASE 2: DJ Studio Prisma M1–M4 + Supabase M5 + Product seed + validate
#
# Ordering guarantees:
# - S1–S7 run before Domain Prisma M1 renames legacy tables
# - Foundation OWNER role exists before M4 personal-org bootstrap
# - Validator uses permission keys, not rigid totals

: "${MIGRATION_DATABASE_URL:?MIGRATION_DATABASE_URL is required}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${SUPABASE_CLI_VERSION:?SUPABASE_CLI_VERSION is required}"

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"

# SUPABASE_DB_URL retained for operator/env contract compatibility (ADR-010).
# Foundation Supabase SQL is applied via apply-supabase-migrations-dir.ts.
export SUPABASE_DB_URL
export SUPABASE_CLI_VERSION

sh "$ROOT_DIR/scripts/deploy/migrate-foundation.sh"
sh "$ROOT_DIR/scripts/deploy/migrate-dj-studio.sh"

echo "Release migrate complete"
