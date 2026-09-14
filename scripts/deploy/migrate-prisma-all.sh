#!/bin/sh
set -eu

# Apply all Prisma migrations (Foundation + DJ Studio) for local/test DBs.
# Does not run Supabase migrations or seeds.

: "${DATABASE_URL:?DATABASE_URL is required}"

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"

DATABASE_URL="$DATABASE_URL" prisma migrate deploy
DATABASE_URL="$DATABASE_URL" \
  prisma migrate deploy --config "$ROOT_DIR/prisma.dj-studio.config.ts"
