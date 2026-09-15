#!/bin/sh
set -eu
set -o pipefail

: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is required}"
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"

restic cat config >/dev/null

dump_file=/tmp/platform-postgres.dump
trap 'rm -f "$dump_file"' EXIT HUP INT TERM

pg_dump \
  --dbname "$BACKUP_DATABASE_URL" \
  --format custom \
  --no-owner \
  --no-acl \
  --file "$dump_file"

test -s "$dump_file"
pg_restore --list "$dump_file" >/dev/null

restic backup \
  --stdin \
  --stdin-filename platform-postgres.dump \
  --tag platform-postgres \
  --host "${BACKUP_HOST:-platform-staging}" \
  < "$dump_file"

restic forget \
  --tag platform-postgres \
  --keep-daily 7 \
  --keep-weekly 4 \
  --prune

restic check
