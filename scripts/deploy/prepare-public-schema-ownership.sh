#!/bin/sh
set -eu

: "${POSTGRES_ADMIN_URL:?POSTGRES_ADMIN_URL is required}"
: "${MIGRATION_ROLE_NAME:?MIGRATION_ROLE_NAME is required}"

# Applies scripts/deploy/prepare-public-schema-ownership.sql as the cluster
# administrator after bootstrap-roles. Does not modify auth.* ownership.

PGOPTIONS="-c platform.migration_role=$MIGRATION_ROLE_NAME" \
  psql "$POSTGRES_ADMIN_URL" \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --file scripts/deploy/prepare-public-schema-ownership.sql
