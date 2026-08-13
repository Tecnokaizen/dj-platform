#!/bin/sh
set -eu

repository_root="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
. "$repository_root/infra/supabase/release.env"

target="$repository_root/infra/supabase/vendor"
temporary="$(mktemp -d)"
trap 'rm -rf "$temporary"' EXIT

git clone --quiet --filter=blob:none --no-checkout \
  https://github.com/supabase/supabase.git "$temporary/supabase"
git -C "$temporary/supabase" checkout --quiet "$SUPABASE_SELF_HOSTED_COMMIT" -- docker

resolved_commit="$(git -C "$temporary/supabase" rev-parse "$SUPABASE_SELF_HOSTED_COMMIT^{commit}")"
if [ "$resolved_commit" != "$SUPABASE_SELF_HOSTED_COMMIT" ]; then
  echo "Supabase release commit mismatch" >&2
  exit 1
fi

rm -rf "$target"
mkdir -p "$target"
cp -R "$temporary/supabase/docker/." "$target/"
printf '%s\n' "$SUPABASE_SELF_HOSTED_COMMIT" > "$target/.supabase-source-commit"

echo "Official Supabase $SUPABASE_SELF_HOSTED_RELEASE materialized at $target"
