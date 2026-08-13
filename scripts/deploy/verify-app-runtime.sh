#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL must contain the app_runtime connection}"
: "${MIGRATION_ROLE_NAME:=platform_migration}"

psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command 'SELECT count(*) FROM public.roles' >/dev/null

if psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command 'CREATE TABLE public.runtime_must_not_create (id integer)' >/dev/null 2>&1; then
  echo 'app_runtime unexpectedly has DDL privileges' >&2
  exit 1
fi

if psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command "SET ROLE \"$MIGRATION_ROLE_NAME\"" >/dev/null 2>&1; then
  echo 'app_runtime unexpectedly can assume migration role' >&2
  exit 1
fi

echo 'app_runtime practical privilege checks passed'

