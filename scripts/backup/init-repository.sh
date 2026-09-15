#!/bin/sh
set -eu

: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"

if restic cat config >/dev/null 2>&1; then
  echo 'backup repository already initialized'
else
  restic init
fi
