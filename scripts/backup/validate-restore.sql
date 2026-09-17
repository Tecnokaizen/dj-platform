\set ON_ERROR_STOP on

DO $validation$
DECLARE
  missing_keys text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public._prisma_migrations
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
  ) THEN
    RAISE EXCEPTION 'restored Prisma migration ledger is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations) THEN
    RAISE EXCEPTION 'restored Supabase migration ledger is empty';
  END IF;

  -- Foundation system roles (by key; extras allowed)
  SELECT string_agg(required.key, ', ' ORDER BY required.key)
  INTO missing_keys
  FROM (
    VALUES
      ('OWNER'),
      ('ADMIN'),
      ('MANAGER'),
      ('MEMBER'),
      ('VIEWER')
  ) AS required(key)
  LEFT JOIN public.roles r
    ON r.key = required.key
   AND r.is_system = true
  WHERE r.id IS NULL;

  IF missing_keys IS NOT NULL THEN
    RAISE EXCEPTION 'restored Role catalog is incomplete: missing %', missing_keys;
  END IF;

  -- Foundation Core permission keys (extras Domain allowed)
  SELECT string_agg(required.key, ', ' ORDER BY required.key)
  INTO missing_keys
  FROM (
    VALUES
      ('organizations.read'),
      ('organizations.update'),
      ('organizations.transfer_ownership'),
      ('memberships.read'),
      ('memberships.suspend'),
      ('memberships.restore'),
      ('memberships.remove'),
      ('memberships.change_role'),
      ('invitations.read'),
      ('invitations.create'),
      ('invitations.revoke'),
      ('invitations.resend')
  ) AS required(key)
  LEFT JOIN public.permissions p ON p.key = required.key
  WHERE p.id IS NULL;

  IF missing_keys IS NOT NULL THEN
    RAISE EXCEPTION 'restored Foundation Permission catalog is incomplete: missing %', missing_keys;
  END IF;

  -- DJ Studio Domain permission keys (Product release restore)
  SELECT string_agg(required.key, ', ' ORDER BY required.key)
  INTO missing_keys
  FROM (
    VALUES
      ('library.read'),
      ('library.manage'),
      ('playlists.read'),
      ('playlists.manage')
  ) AS required(key)
  LEFT JOIN public.permissions p ON p.key = required.key
  WHERE p.id IS NULL;

  IF missing_keys IS NOT NULL THEN
    RAISE EXCEPTION 'restored DJ Studio Permission catalog is incomplete: missing %', missing_keys;
  END IF;
END
$validation$;

SELECT 'isolated restore validation passed' AS result;
