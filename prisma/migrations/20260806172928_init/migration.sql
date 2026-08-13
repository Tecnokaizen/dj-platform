-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "ArtistType" AS ENUM ('PERSON', 'GROUP', 'PROJECT', 'ORCHESTRA', 'COLLECTIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ArtistRole" AS ENUM ('PRIMARY', 'FEATURED', 'REMIXER', 'PRODUCER', 'COMPOSER', 'VOCALIST', 'DJ_MIXER', 'OTHER');

-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('SINGLE', 'EP', 'ALBUM', 'COMPILATION', 'DJ_MIX', 'SOUNDTRACK', 'LIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentMethod" AS ENUM ('SOURCE', 'AI', 'AUDIO_ANALYSIS', 'MANUAL', 'CONSENSUS');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('API', 'WEB', 'FILE', 'AI', 'MANUAL', 'INTERNAL');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ARTIST', 'TRACK', 'RELEASE', 'LABEL', 'GENRE', 'PLAYLIST', 'DJ_SET');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('UNKNOWN', 'AVAILABLE', 'UNAVAILABLE', 'REGION_RESTRICTED', 'REMOVED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ExtractionMethod" AS ENUM ('API_RESPONSE', 'HTML_PARSER', 'STRUCTURED_DATA', 'METADATA', 'AUDIO_ANALYSIS', 'AI_EXTRACTION', 'AI_INFERENCE', 'MANUAL', 'DERIVED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'PARTIALLY_COMPLETED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IngestionJobType" AS ENUM ('TRACKLIST_URL', 'TRACKLIST_TEXT', 'PLAYLIST_URL', 'CHANNEL_SCAN', 'SOURCE_SYNC', 'FILE_IMPORT', 'MANUAL_BATCH');

-- CreateEnum
CREATE TYPE "IngestionItemStatus" AS ENUM ('PENDING', 'PARSED', 'MATCHED', 'CREATED', 'NEEDS_REVIEW', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "EnrichmentJobType" AS ENUM ('METADATA_ENRICHMENT', 'TRACK_MATCHING', 'GENRE_CLASSIFICATION', 'BPM_ANALYSIS', 'KEY_ANALYSIS', 'MOOD_CLASSIFICATION', 'ENERGY_CLASSIFICATION', 'ARTIST_RESOLUTION', 'DUPLICATE_DETECTION', 'SOURCE_DISCOVERY', 'PLAYLIST_ANALYSIS', 'TRANSITION_RECOMMENDATION');

-- CreateEnum
CREATE TYPE "UserTrackStatus" AS ENUM ('LIBRARY', 'WISHLIST', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlaylistType" AS ENUM ('MANUAL', 'IMPORTED', 'SMART', 'AI_GENERATED', 'CRATE');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50),
    "display_name" VARCHAR(120),
    "dj_name" VARCHAR(120),
    "avatar_url" TEXT,
    "bio" TEXT,
    "country_code" CHAR(2),
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'es',
    "experience_level" "ExperienceLevel",
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "normalized_name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "artist_type" "ArtistType" NOT NULL DEFAULT 'PERSON',
    "country_code" CHAR(2),
    "biography" TEXT,
    "image_url" TEXT,
    "canonical_confidence" DECIMAL(5,4),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "normalized_title" VARCHAR(500) NOT NULL,
    "version" VARCHAR(255),
    "duration_ms" INTEGER,
    "bpm" DECIMAL(7,3),
    "musical_key" VARCHAR(20),
    "camelot_key" VARCHAR(4),
    "isrc" VARCHAR(20),
    "release_date" DATE,
    "explicit" BOOLEAN,
    "artwork_url" TEXT,
    "canonical_confidence" DECIMAL(5,4),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_artists" (
    "track_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "role" "ArtistRole" NOT NULL,
    "position" SMALLINT NOT NULL DEFAULT 0,
    "credited_name" VARCHAR(255),

    CONSTRAINT "track_artists_pkey" PRIMARY KEY ("track_id","artist_id","role")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalized_name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "parent_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_genres" (
    "track_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DECIMAL(5,4),
    "assignment_method" "AssignmentMethod" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_genres_pkey" PRIMARY KEY ("track_id","genre_id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "normalized_name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "country_code" CHAR(2),
    "website_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "normalized_title" VARCHAR(500) NOT NULL,
    "release_type" "ReleaseType" NOT NULL,
    "label_id" UUID,
    "catalog_number" VARCHAR(100),
    "release_date" DATE,
    "artwork_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_tracks" (
    "release_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "disc_number" SMALLINT NOT NULL DEFAULT 1,
    "track_number" SMALLINT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "release_tracks_pkey" PRIMARY KEY ("release_id","position")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "base_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trust_weight" DECIMAL(5,4) NOT NULL DEFAULT 0.5000,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_entities" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "external_id" VARCHAR(500),
    "external_url" TEXT,
    "external_name" TEXT,
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "last_checked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "external_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_snapshots" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "source_url" TEXT,
    "external_id" VARCHAR(500),
    "content_type" VARCHAR(120),
    "http_status" SMALLINT,
    "raw_payload" JSONB,
    "raw_text" TEXT,
    "content_hash" VARCHAR(128),
    "parser_version" VARCHAR(80),
    "fetched_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_facts" (
    "id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "field_name" VARCHAR(120) NOT NULL,
    "value_json" JSONB NOT NULL,
    "normalized_value" TEXT,
    "source_id" UUID,
    "snapshot_id" UUID,
    "extraction_method" "ExtractionMethod" NOT NULL,
    "confidence" DECIMAL(5,4),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "observed_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_jobs" (
    "id" UUID NOT NULL,
    "requested_by" UUID,
    "source_id" UUID,
    "job_type" "IngestionJobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "source_url" TEXT,
    "input" JSONB NOT NULL DEFAULT '{}',
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "processed_items" INTEGER NOT NULL DEFAULT 0,
    "successful_items" INTEGER NOT NULL DEFAULT 0,
    "failed_items" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_items" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "source_position" INTEGER,
    "source_timestamp_ms" INTEGER,
    "raw_title" TEXT,
    "raw_artist" TEXT,
    "raw_data" JSONB NOT NULL DEFAULT '{}',
    "matched_track_id" UUID,
    "status" "IngestionItemStatus" NOT NULL DEFAULT 'PENDING',
    "match_confidence" DECIMAL(5,4),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ingestion_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrichment_jobs" (
    "id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "job_type" "EnrichmentJobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "provider" VARCHAR(120),
    "model_name" VARCHAR(160),
    "process_version" VARCHAR(80),
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "confidence" DECIMAL(5,4),
    "tokens_used" INTEGER,
    "estimated_cost" DECIMAL(12,6),
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrichment_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tracks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "status" "UserTrackStatus" NOT NULL DEFAULT 'LIBRARY',
    "rating" SMALLINT,
    "energy" SMALLINT,
    "familiarity" SMALLINT,
    "notes" TEXT,
    "custom_bpm" DECIMAL(7,3),
    "custom_key" VARCHAR(20),
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "date_added" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_played_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "normalized_name" VARCHAR(80) NOT NULL,
    "color" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_track_tags" (
    "user_track_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "user_track_tags_pkey" PRIMARY KEY ("user_track_id","tag_id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT,
    "playlist_type" "PlaylistType" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "artwork_url" TEXT,
    "source_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" UUID NOT NULL,
    "playlist_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "added_by" UUID,
    "notes" TEXT,
    "transition_notes" TEXT,
    "source_timestamp_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");

-- CreateIndex
CREATE INDEX "artists_normalized_name_idx" ON "artists"("normalized_name");

-- CreateIndex
CREATE INDEX "tracks_normalized_title_idx" ON "tracks"("normalized_title");

-- CreateIndex
CREATE INDEX "tracks_isrc_idx" ON "tracks"("isrc");

-- CreateIndex
CREATE INDEX "tracks_bpm_idx" ON "tracks"("bpm");

-- CreateIndex
CREATE INDEX "tracks_camelot_key_idx" ON "tracks"("camelot_key");

-- CreateIndex
CREATE INDEX "track_artists_artist_id_idx" ON "track_artists"("artist_id");

-- CreateIndex
CREATE INDEX "track_artists_track_id_position_idx" ON "track_artists"("track_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE INDEX "genres_normalized_name_idx" ON "genres"("normalized_name");

-- CreateIndex
CREATE INDEX "genres_parent_id_idx" ON "genres"("parent_id");

-- CreateIndex
CREATE INDEX "track_genres_genre_id_idx" ON "track_genres"("genre_id");

-- CreateIndex
CREATE INDEX "track_genres_track_id_is_primary_idx" ON "track_genres"("track_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "labels_slug_key" ON "labels"("slug");

-- CreateIndex
CREATE INDEX "labels_normalized_name_idx" ON "labels"("normalized_name");

-- CreateIndex
CREATE INDEX "releases_normalized_title_idx" ON "releases"("normalized_title");

-- CreateIndex
CREATE INDEX "releases_label_id_idx" ON "releases"("label_id");

-- CreateIndex
CREATE INDEX "releases_release_date_idx" ON "releases"("release_date");

-- CreateIndex
CREATE INDEX "releases_catalog_number_idx" ON "releases"("catalog_number");

-- CreateIndex
CREATE INDEX "release_tracks_track_id_idx" ON "release_tracks"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "release_tracks_release_id_disc_number_track_number_key" ON "release_tracks"("release_id", "disc_number", "track_number");

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_code_key" ON "data_sources"("code");

-- CreateIndex
CREATE INDEX "external_entities_entity_type_entity_id_idx" ON "external_entities"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "external_entities_source_id_entity_type_idx" ON "external_entities"("source_id", "entity_type");

-- CreateIndex
CREATE INDEX "external_entities_last_checked_at_idx" ON "external_entities"("last_checked_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_entities_source_id_entity_type_external_id_key" ON "external_entities"("source_id", "entity_type", "external_id");

-- CreateIndex
CREATE INDEX "source_snapshots_content_hash_idx" ON "source_snapshots"("content_hash");

-- CreateIndex
CREATE INDEX "source_snapshots_source_id_external_id_idx" ON "source_snapshots"("source_id", "external_id");

-- CreateIndex
CREATE INDEX "source_snapshots_fetched_at_idx" ON "source_snapshots"("fetched_at" DESC);

-- CreateIndex
CREATE INDEX "source_snapshots_expires_at_idx" ON "source_snapshots"("expires_at");

-- CreateIndex
CREATE INDEX "entity_facts_entity_type_entity_id_field_name_idx" ON "entity_facts"("entity_type", "entity_id", "field_name");

-- CreateIndex
CREATE INDEX "entity_facts_source_id_idx" ON "entity_facts"("source_id");

-- CreateIndex
CREATE INDEX "entity_facts_snapshot_id_idx" ON "entity_facts"("snapshot_id");

-- CreateIndex
CREATE INDEX "entity_facts_is_selected_idx" ON "entity_facts"("is_selected");

-- CreateIndex
CREATE INDEX "entity_facts_is_verified_idx" ON "entity_facts"("is_verified");

-- CreateIndex
CREATE INDEX "ingestion_jobs_status_idx" ON "ingestion_jobs"("status");

-- CreateIndex
CREATE INDEX "ingestion_jobs_job_type_idx" ON "ingestion_jobs"("job_type");

-- CreateIndex
CREATE INDEX "ingestion_jobs_requested_by_created_at_idx" ON "ingestion_jobs"("requested_by", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ingestion_jobs_source_id_created_at_idx" ON "ingestion_jobs"("source_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ingestion_items_job_id_status_idx" ON "ingestion_items"("job_id", "status");

-- CreateIndex
CREATE INDEX "ingestion_items_matched_track_id_idx" ON "ingestion_items"("matched_track_id");

-- CreateIndex
CREATE INDEX "ingestion_items_raw_title_idx" ON "ingestion_items"("raw_title");

-- CreateIndex
CREATE INDEX "ingestion_items_source_timestamp_ms_idx" ON "ingestion_items"("source_timestamp_ms");

-- CreateIndex
CREATE INDEX "enrichment_jobs_entity_type_entity_id_idx" ON "enrichment_jobs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "enrichment_jobs_status_idx" ON "enrichment_jobs"("status");

-- CreateIndex
CREATE INDEX "enrichment_jobs_job_type_idx" ON "enrichment_jobs"("job_type");

-- CreateIndex
CREATE INDEX "enrichment_jobs_created_at_idx" ON "enrichment_jobs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "user_tracks_user_id_date_added_idx" ON "user_tracks"("user_id", "date_added" DESC);

-- CreateIndex
CREATE INDEX "user_tracks_user_id_is_favorite_idx" ON "user_tracks"("user_id", "is_favorite");

-- CreateIndex
CREATE INDEX "user_tracks_user_id_status_idx" ON "user_tracks"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_tracks_track_id_idx" ON "user_tracks"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tracks_user_id_track_id_key" ON "user_tracks"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- CreateIndex
CREATE INDEX "tags_normalized_name_idx" ON "tags"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_normalized_name_key" ON "tags"("user_id", "normalized_name");

-- CreateIndex
CREATE INDEX "playlists_user_id_updated_at_idx" ON "playlists"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "playlists_visibility_idx" ON "playlists"("visibility");

-- CreateIndex
CREATE INDEX "playlists_playlist_type_idx" ON "playlists"("playlist_type");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_user_id_slug_key" ON "playlists"("user_id", "slug");

-- CreateIndex
CREATE INDEX "playlist_tracks_playlist_id_position_idx" ON "playlist_tracks"("playlist_id", "position");

-- CreateIndex
CREATE INDEX "playlist_tracks_track_id_idx" ON "playlist_tracks"("track_id");

-- CreateIndex
CREATE INDEX "playlist_tracks_added_by_idx" ON "playlist_tracks"("added_by");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_playlist_id_position_key" ON "playlist_tracks"("playlist_id", "position");

-- AddForeignKey
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genres" ADD CONSTRAINT "genres_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_genres" ADD CONSTRAINT "track_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_tracks" ADD CONSTRAINT "release_tracks_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_tracks" ADD CONSTRAINT "release_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_entities" ADD CONSTRAINT "external_entities_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_snapshots" ADD CONSTRAINT "source_snapshots_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_facts" ADD CONSTRAINT "entity_facts_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_facts" ADD CONSTRAINT "entity_facts_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "source_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_items" ADD CONSTRAINT "ingestion_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ingestion_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_items" ADD CONSTRAINT "ingestion_items_matched_track_id_fkey" FOREIGN KEY ("matched_track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tracks" ADD CONSTRAINT "user_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tracks" ADD CONSTRAINT "user_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_track_tags" ADD CONSTRAINT "user_track_tags_user_track_id_fkey" FOREIGN KEY ("user_track_id") REFERENCES "user_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_track_tags" ADD CONSTRAINT "user_track_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
