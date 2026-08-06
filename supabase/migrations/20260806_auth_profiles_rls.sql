-- ============================================================
-- DJ PLATFORM
-- Supabase Auth + Profiles + Row Level Security
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PROFILE -> AUTH RELATION
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_auth_user_fkey'
    ) THEN

        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_auth_user_fkey
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

    END IF;
END $$;

-- ============================================================
-- 2. AUTO CREATE PROFILE
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.profiles(
        id,
        username,
        display_name,
        avatar_url,
        preferred_language,
        created_at,
        updated_at
    )
    VALUES (

        NEW.id,

        NULLIF(NEW.raw_user_meta_data->>'username',''),

        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'display_name',''),
            NULLIF(NEW.raw_user_meta_data->>'full_name',''),
            split_part(NEW.email,'@',1)
        ),

        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'avatar_url',''),
            NULLIF(NEW.raw_user_meta_data->>'picture','')
        ),

        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'preferred_language',''),
            'es'
        ),

        now(),
        now()

    )
    ON CONFLICT(id) DO NOTHING;

    RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. ENABLE RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_track_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. DROP OLD POLICIES
-- ============================================================

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

DROP POLICY IF EXISTS playlists_select_accessible ON public.playlists;
DROP POLICY IF EXISTS playlists_insert_own ON public.playlists;
DROP POLICY IF EXISTS playlists_update_own ON public.playlists;
DROP POLICY IF EXISTS playlists_delete_own ON public.playlists;

DROP POLICY IF EXISTS playlist_tracks_select_accessible ON public.playlist_tracks;
DROP POLICY IF EXISTS playlist_tracks_insert_own ON public.playlist_tracks;
DROP POLICY IF EXISTS playlist_tracks_update_own ON public.playlist_tracks;
DROP POLICY IF EXISTS playlist_tracks_delete_own ON public.playlist_tracks;

DROP POLICY IF EXISTS tags_select_own ON public.tags;
DROP POLICY IF EXISTS tags_insert_own ON public.tags;
DROP POLICY IF EXISTS tags_update_own ON public.tags;
DROP POLICY IF EXISTS tags_delete_own ON public.tags;

DROP POLICY IF EXISTS user_tracks_select_own ON public.user_tracks;
DROP POLICY IF EXISTS user_tracks_insert_own ON public.user_tracks;
DROP POLICY IF EXISTS user_tracks_update_own ON public.user_tracks;
DROP POLICY IF EXISTS user_tracks_delete_own ON public.user_tracks;

DROP POLICY IF EXISTS user_track_tags_select_own ON public.user_track_tags;
DROP POLICY IF EXISTS user_track_tags_insert_own ON public.user_track_tags;
DROP POLICY IF EXISTS user_track_tags_delete_own ON public.user_track_tags;

DROP POLICY IF EXISTS ingestion_jobs_select_own ON public.ingestion_jobs;
DROP POLICY IF EXISTS ingestion_jobs_insert_own ON public.ingestion_jobs;

DROP POLICY IF EXISTS ingestion_items_select_own ON public.ingestion_items;

-- ============================================================
-- 5. PROFILES
-- ============================================================

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================
-- 6. USER TRACKS
-- ============================================================

CREATE POLICY user_tracks_select_own
ON public.user_tracks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY user_tracks_insert_own
ON public.user_tracks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_tracks_update_own
ON public.user_tracks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_tracks_delete_own
ON public.user_tracks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- 7. TAGS
-- ============================================================

CREATE POLICY tags_select_own
ON public.tags
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY tags_insert_own
ON public.tags
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY tags_update_own
ON public.tags
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY tags_delete_own
ON public.tags
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- 8. USER TRACK TAGS
-- ============================================================

CREATE POLICY user_track_tags_select_own
ON public.user_track_tags
FOR SELECT
TO authenticated
USING (
EXISTS (
SELECT 1
FROM public.user_tracks ut
WHERE ut.id=user_track_tags.user_track_id
AND ut.user_id=auth.uid()
)
);

CREATE POLICY user_track_tags_insert_own
ON public.user_track_tags
FOR INSERT
TO authenticated
WITH CHECK (
EXISTS (
SELECT 1
FROM public.user_tracks ut
WHERE ut.id=user_track_tags.user_track_id
AND ut.user_id=auth.uid()
)
);

CREATE POLICY user_track_tags_delete_own
ON public.user_track_tags
FOR DELETE
TO authenticated
USING (
EXISTS (
SELECT 1
FROM public.user_tracks ut
WHERE ut.id=user_track_tags.user_track_id
AND ut.user_id=auth.uid()
)
);

-- ============================================================
-- 9. PLAYLISTS
-- ============================================================

CREATE POLICY playlists_select_accessible
ON public.playlists
FOR SELECT
TO authenticated, anon
USING (
visibility='PUBLIC'
OR user_id=auth.uid()
);

CREATE POLICY playlists_insert_own
ON public.playlists
FOR INSERT
TO authenticated
WITH CHECK (user_id=auth.uid());

CREATE POLICY playlists_update_own
ON public.playlists
FOR UPDATE
TO authenticated
USING (user_id=auth.uid())
WITH CHECK (user_id=auth.uid());

CREATE POLICY playlists_delete_own
ON public.playlists
FOR DELETE
TO authenticated
USING (user_id=auth.uid());

-- ============================================================
-- 10. PLAYLIST TRACKS
-- ============================================================

CREATE POLICY playlist_tracks_select_accessible
ON public.playlist_tracks
FOR SELECT
TO authenticated, anon
USING (
EXISTS (
SELECT 1
FROM public.playlists p
WHERE p.id=playlist_tracks.playlist_id
AND (
p.visibility='PUBLIC'
OR p.user_id=auth.uid()
)
)
);

CREATE POLICY playlist_tracks_insert_own
ON public.playlist_tracks
FOR INSERT
TO authenticated
WITH CHECK (
EXISTS(
SELECT 1
FROM public.playlists p
WHERE p.id=playlist_tracks.playlist_id
AND p.user_id=auth.uid()
)
);

CREATE POLICY playlist_tracks_update_own
ON public.playlist_tracks
FOR UPDATE
TO authenticated
USING (
EXISTS(
SELECT 1
FROM public.playlists p
WHERE p.id=playlist_tracks.playlist_id
AND p.user_id=auth.uid()
)
)
WITH CHECK (
EXISTS(
SELECT 1
FROM public.playlists p
WHERE p.id=playlist_tracks.playlist_id
AND p.user_id=auth.uid()
)
);

CREATE POLICY playlist_tracks_delete_own
ON public.playlist_tracks
FOR DELETE
TO authenticated
USING (
EXISTS(
SELECT 1
FROM public.playlists p
WHERE p.id=playlist_tracks.playlist_id
AND p.user_id=auth.uid()
)
);

-- ============================================================
-- 11. INGESTION
-- ============================================================

CREATE POLICY ingestion_jobs_select_own
ON public.ingestion_jobs
FOR SELECT
TO authenticated
USING (requested_by=auth.uid());

CREATE POLICY ingestion_jobs_insert_own
ON public.ingestion_jobs
FOR INSERT
TO authenticated
WITH CHECK (requested_by=auth.uid());

CREATE POLICY ingestion_items_select_own
ON public.ingestion_items
FOR SELECT
TO authenticated
USING (
EXISTS(
SELECT 1
FROM public.ingestion_jobs j
WHERE j.id=ingestion_items.job_id
AND j.requested_by=auth.uid()
)
);

-- ============================================================
-- 12. PUBLIC READ
-- ============================================================

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_genres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS artists_public_read ON public.artists;
DROP POLICY IF EXISTS genres_public_read ON public.genres;
DROP POLICY IF EXISTS labels_public_read ON public.labels;
DROP POLICY IF EXISTS releases_public_read ON public.releases;
DROP POLICY IF EXISTS release_tracks_public_read ON public.release_tracks;
DROP POLICY IF EXISTS tracks_public_read ON public.tracks;
DROP POLICY IF EXISTS track_artists_public_read ON public.track_artists;
DROP POLICY IF EXISTS track_genres_public_read ON public.track_genres;

CREATE POLICY artists_public_read ON public.artists FOR SELECT USING (true);
CREATE POLICY genres_public_read ON public.genres FOR SELECT USING (true);
CREATE POLICY labels_public_read ON public.labels FOR SELECT USING (true);
CREATE POLICY releases_public_read ON public.releases FOR SELECT USING (true);
CREATE POLICY release_tracks_public_read ON public.release_tracks FOR SELECT USING (true);
CREATE POLICY tracks_public_read ON public.tracks FOR SELECT USING (true);
CREATE POLICY track_artists_public_read ON public.track_artists FOR SELECT USING (true);
CREATE POLICY track_genres_public_read ON public.track_genres FOR SELECT USING (true);

COMMIT;