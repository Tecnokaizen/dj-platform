#!/bin/sh
set -eu
set -o pipefail

: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required}"
: "${RESTORE_CONFIRM_DATABASE:?RESTORE_CONFIRM_DATABASE is required}"
: "${ALLOW_ISOLATED_RESTORE:?ALLOW_ISOLATED_RESTORE is required}"
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"

if [ "$ALLOW_ISOLATED_RESTORE" != 'YES_I_UNDERSTAND' ]; then
  echo 'isolated restore confirmation is invalid' >&2
  exit 1
fi

actual_database="$(psql "$RESTORE_DATABASE_URL" --no-psqlrc --tuples-only --no-align --command 'SELECT current_database()')"

if [ "$actual_database" != "$RESTORE_CONFIRM_DATABASE" ]; then
  echo 'restore target database name does not match explicit confirmation' >&2
  exit 1
fi

case "$actual_database" in
  postgres|template0|template1)
    echo 'restore into a system database is forbidden' >&2
    exit 1
    ;;
esac

if [ "${BACKUP_DATABASE_URL:-}" = "$RESTORE_DATABASE_URL" ]; then
  echo 'restore target must differ from the backup source' >&2
  exit 1
fi

restic dump latest platform-postgres.dump --tag platform-postgres \
  | pg_restore \
      --dbname "$RESTORE_DATABASE_URL" \
      --clean \
      --if-exists \
      --no-owner \
      --no-acl \
      --exit-on-error

psql "$RESTORE_DATABASE_URL" \
  --no-psqlrc \
  --set ON_ERROR_STOP=1 \
  --file /opt/platform/backup/validate-restore.sql
