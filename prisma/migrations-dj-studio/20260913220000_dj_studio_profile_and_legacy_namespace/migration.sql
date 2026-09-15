-- DJ Studio M1: legacy DJ table namespace + dj_studio_profiles
-- Forward-only. Does not drop Profile DJ columns or legacy data.

ALTER TABLE "user_tracks" RENAME TO "legacy_user_tracks";
ALTER TABLE "tags" RENAME TO "legacy_profile_tags";
ALTER TABLE "user_track_tags" RENAME TO "legacy_user_track_tags";
ALTER TABLE "playlists" RENAME TO "legacy_profile_playlists";
ALTER TABLE "playlist_tracks" RENAME TO "legacy_playlist_tracks";

-- Align constraint/index names with Prisma model maps (required for schema parity).
ALTER TABLE "legacy_user_tracks" RENAME CONSTRAINT "user_tracks_pkey" TO "legacy_user_tracks_pkey";
ALTER TABLE "legacy_user_tracks" RENAME CONSTRAINT "user_tracks_user_id_fkey" TO "legacy_user_tracks_user_id_fkey";
ALTER TABLE "legacy_user_tracks" RENAME CONSTRAINT "user_tracks_track_id_fkey" TO "legacy_user_tracks_track_id_fkey";
ALTER INDEX "user_tracks_user_id_date_added_idx" RENAME TO "legacy_user_tracks_user_id_date_added_idx";
ALTER INDEX "user_tracks_user_id_is_favorite_idx" RENAME TO "legacy_user_tracks_user_id_is_favorite_idx";
ALTER INDEX "user_tracks_user_id_status_idx" RENAME TO "legacy_user_tracks_user_id_status_idx";
ALTER INDEX "user_tracks_track_id_idx" RENAME TO "legacy_user_tracks_track_id_idx";
ALTER INDEX "user_tracks_user_id_track_id_key" RENAME TO "legacy_user_tracks_user_id_track_id_key";

ALTER TABLE "legacy_profile_tags" RENAME CONSTRAINT "tags_pkey" TO "legacy_profile_tags_pkey";
ALTER TABLE "legacy_profile_tags" RENAME CONSTRAINT "tags_user_id_fkey" TO "legacy_profile_tags_user_id_fkey";
ALTER INDEX "tags_user_id_idx" RENAME TO "legacy_profile_tags_user_id_idx";
ALTER INDEX "tags_normalized_name_idx" RENAME TO "legacy_profile_tags_normalized_name_idx";
ALTER INDEX "tags_user_id_normalized_name_key" RENAME TO "legacy_profile_tags_user_id_normalized_name_key";

ALTER TABLE "legacy_user_track_tags" RENAME CONSTRAINT "user_track_tags_pkey" TO "legacy_user_track_tags_pkey";
ALTER TABLE "legacy_user_track_tags" RENAME CONSTRAINT "user_track_tags_user_track_id_fkey" TO "legacy_user_track_tags_user_track_id_fkey";
ALTER TABLE "legacy_user_track_tags" RENAME CONSTRAINT "user_track_tags_tag_id_fkey" TO "legacy_user_track_tags_tag_id_fkey";

ALTER TABLE "legacy_profile_playlists" RENAME CONSTRAINT "playlists_pkey" TO "legacy_profile_playlists_pkey";
ALTER TABLE "legacy_profile_playlists" RENAME CONSTRAINT "playlists_user_id_fkey" TO "legacy_profile_playlists_user_id_fkey";
ALTER INDEX "playlists_user_id_updated_at_idx" RENAME TO "legacy_profile_playlists_user_id_updated_at_idx";
ALTER INDEX "playlists_visibility_idx" RENAME TO "legacy_profile_playlists_visibility_idx";
ALTER INDEX "playlists_playlist_type_idx" RENAME TO "legacy_profile_playlists_playlist_type_idx";
ALTER INDEX "playlists_user_id_slug_key" RENAME TO "legacy_profile_playlists_user_id_slug_key";

ALTER TABLE "legacy_playlist_tracks" RENAME CONSTRAINT "playlist_tracks_pkey" TO "legacy_playlist_tracks_pkey";
ALTER TABLE "legacy_playlist_tracks" RENAME CONSTRAINT "playlist_tracks_playlist_id_fkey" TO "legacy_playlist_tracks_playlist_id_fkey";
ALTER TABLE "legacy_playlist_tracks" RENAME CONSTRAINT "playlist_tracks_track_id_fkey" TO "legacy_playlist_tracks_track_id_fkey";
ALTER TABLE "legacy_playlist_tracks" RENAME CONSTRAINT "playlist_tracks_added_by_fkey" TO "legacy_playlist_tracks_added_by_fkey";
ALTER INDEX "playlist_tracks_playlist_id_position_idx" RENAME TO "legacy_playlist_tracks_playlist_id_position_idx";
ALTER INDEX "playlist_tracks_track_id_idx" RENAME TO "legacy_playlist_tracks_track_id_idx";
ALTER INDEX "playlist_tracks_added_by_idx" RENAME TO "legacy_playlist_tracks_added_by_idx";
ALTER INDEX "playlist_tracks_playlist_id_position_key" RENAME TO "legacy_playlist_tracks_playlist_id_position_key";

CREATE TABLE "dj_studio_profiles" (
    "profile_id" UUID NOT NULL,
    "stage_name" VARCHAR(120),
    "experience_level" "ExperienceLevel",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "dj_studio_profiles_pkey" PRIMARY KEY ("profile_id")
);

ALTER TABLE "dj_studio_profiles"
  ADD CONSTRAINT "dj_studio_profiles_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "dj_studio_profiles" (
  "profile_id",
  "stage_name",
  "experience_level",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  "dj_name",
  "experience_level",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "profiles"
WHERE "dj_name" IS NOT NULL
   OR "experience_level" IS NOT NULL;
