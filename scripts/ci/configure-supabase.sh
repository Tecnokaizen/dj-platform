#!/bin/sh
set -eu

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

source_file="infra/supabase/vendor/.env.example"
target_file="infra/supabase/vendor/.env"

test -f "$source_file"
cp "$source_file" "$target_file"

sed -i.bak \
  -e "s|^POSTGRES_PASSWORD=.*$|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" \
  -e 's|^POSTGRES_DB=.*$|POSTGRES_DB=dj_platform_test|' \
  -e 's|^POSTGRES_PORT=.*$|POSTGRES_PORT=5432|' \
  -e 's|^API_GW_HTTP_PORT=.*$|API_GW_HTTP_PORT=8000|' \
  -e 's|^SITE_URL=.*$|SITE_URL=http://127.0.0.1:3000|' \
  -e 's|^SUPABASE_PUBLIC_URL=.*$|SUPABASE_PUBLIC_URL=http://127.0.0.1:8000|' \
  -e 's|^API_EXTERNAL_URL=.*$|API_EXTERNAL_URL=http://127.0.0.1:8000/auth/v1|' \
  "$target_file"
rm "$target_file.bak"
