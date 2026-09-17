#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL must contain the app_runtime connection}"
: "${MIGRATION_ROLE_NAME:=platform_migration}"

psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command 'SELECT count(*) FROM public.roles' >/dev/null

# Domain M6: Product runtime must read shared catalog (SELECT only).
psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command 'SELECT 1 FROM public.tracks LIMIT 1' >/dev/null
psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command 'SELECT 1 FROM public.track_artists LIMIT 1' >/dev/null
psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command 'SELECT 1 FROM public.artists LIMIT 1' >/dev/null

if psql "$DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command "INSERT INTO public.tracks (id, title, normalized_title, created_at, updated_at) VALUES (gen_random_uuid(), 'x', 'x', now(), now())" >/dev/null 2>&1; then
  echo 'app_runtime unexpectedly can INSERT into tracks' >&2
  exit 1
fi

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

