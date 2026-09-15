-- Production-like baseline for Validation B (Foundation complete, Domain not applied)
DO $$
DECLARE
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  t1 uuid := gen_random_uuid();
  t2 uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    instance_id, is_sso_user, is_anonymous
  ) VALUES
    (u1, 'authenticated', 'authenticated', 'u1@example.com', 'x', now(),
     '{}'::jsonb, '{}'::jsonb, now(), now(),
     '00000000-0000-0000-0000-000000000000', false, false),
    (u2, 'authenticated', 'authenticated', 'u2@example.com', 'x', now(),
     '{}'::jsonb, '{}'::jsonb, now(), now(),
     '00000000-0000-0000-0000-000000000000', false, false);

  INSERT INTO public.profiles (id, username, display_name, preferred_language, created_at, updated_at)
  VALUES
    (u1, 'prod_u1', 'Prod User 1', 'es', now(), now()),
    (u2, 'prod_u2', 'Prod User 2', 'es', now(), now())
  ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        display_name = EXCLUDED.display_name;

  INSERT INTO public.tracks (id, title, normalized_title, metadata, created_at, updated_at)
  VALUES
    (t1, 'prod-t-1', 'prod-t-1', '{}'::jsonb, now(), now()),
    (t2, 'prod-t-2', 'prod-t-2', '{}'::jsonb, now(), now());

  INSERT INTO public.user_tracks (
    id, user_id, track_id, status, is_favorite, play_count, date_added, created_at, updated_at
  ) VALUES
    (gen_random_uuid(), u1, t1, 'LIBRARY', false, 0, now(), now(), now()),
    (gen_random_uuid(), u2, t2, 'LIBRARY', true, 1, now(), now(), now());
END $$;
