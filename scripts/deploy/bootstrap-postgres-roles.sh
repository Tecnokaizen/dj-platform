#!/bin/sh
set -eu

: "${POSTGRES_ADMIN_URL:?POSTGRES_ADMIN_URL is required}"
: "${MIGRATION_ROLE_PASSWORD:?MIGRATION_ROLE_PASSWORD is required}"
: "${APP_RUNTIME_ROLE_PASSWORD:?APP_RUNTIME_ROLE_PASSWORD is required}"

export MIGRATION_ROLE_NAME="${MIGRATION_ROLE_NAME:-platform_migration}"
export APP_RUNTIME_ROLE_NAME="${APP_RUNTIME_ROLE_NAME:-app_runtime}"

psql "$POSTGRES_ADMIN_URL" \
  --no-psqlrc \
  --file infra/postgres/bootstrap-roles.sql

PGOPTIONS="-c platform.migration_role=$MIGRATION_ROLE_NAME -c platform.runtime_role=$APP_RUNTIME_ROLE_NAME" \
  psql "$POSTGRES_ADMIN_URL" \
    --no-psqlrc \
    --file infra/postgres/verify-role-contract.sql

