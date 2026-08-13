\set ON_ERROR_STOP on

DO $validation$
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

  IF (SELECT count(*) FROM public.roles WHERE is_system = true) <> 5 THEN
    RAISE EXCEPTION 'restored Role catalog is incomplete';
  END IF;

  IF (SELECT count(*) FROM public.permissions) <> 12 THEN
    RAISE EXCEPTION 'restored Permission catalog is incomplete';
  END IF;
END
$validation$;

SELECT 'isolated restore validation passed' AS result;
