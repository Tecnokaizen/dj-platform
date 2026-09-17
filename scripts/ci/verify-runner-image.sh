#!/bin/sh
set -eu

image="${1:?runner image is required}"

test "$(docker image inspect "$image" --format '{{.Config.User}}')" = nextjs

docker run --rm --entrypoint sh "$image" -c '
  test "$(id -u)" = 1001
  test ! -e node_modules/.bin/prisma
  test ! -e node_modules/.bin/supabase
  test -d .next/static
  test -d public
'

configuration="$(docker image inspect "$image" --format '{{json .Config.Env}} {{json .Config.Cmd}}')"

if printf '%s' "$configuration" | grep -Eq 'MIGRATION_DATABASE_URL|SUPABASE_DB_URL|POSTGRES_ADMIN_URL|SERVICE_ROLE_KEY'; then
  echo 'runner image configuration contains privileged deployment material' >&2
  exit 1
fi

echo 'runner image contract and configuration passed'
