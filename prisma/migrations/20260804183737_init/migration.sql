-- CreateEnum
CREATE TYPE "EditorialStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RETIRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('READER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "GenreRole" AS ENUM ('PRIMARY', 'SECONDARY', 'INFLUENCE', 'HISTORICAL');

-- CreateEnum
CREATE TYPE "AliasType" AS ENUM ('ALTERNATIVE', 'FORMER', 'LEGAL', 'COLLECTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "RankingType" AS ENUM ('EDITORIAL', 'POPULARITY', 'GENRE', 'COUNTRY', 'EMERGING', 'HISTORICAL');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('DJ_SET', 'LIVE_SET', 'RADIO_SHOW', 'PODCAST', 'MIX', 'OTHER');

-- CreateEnum
CREATE TYPE "ExternalPlatform" AS ENUM ('SPOTIFY', 'YOUTUBE', 'YOUTUBE_MUSIC', 'SOUNDCLOUD', 'APPLE_MUSIC', 'BEATPORT', 'DISCOGS', 'MUSICBRAINZ', 'BANDCAMP', 'MIXCLOUD', 'OTHER');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'X', 'TIKTOK', 'THREADS', 'TWITCH', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_WEBSITE', 'INTERVIEW', 'PRESS', 'DATABASE', 'SOCIAL', 'FESTIVAL', 'LABEL', 'STREAMING', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('NEWS', 'GUIDE', 'LIST', 'BIOGRAPHY', 'INTERVIEW', 'REVIEW', 'FEATURE', 'EVERGREEN');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'VALIDATING', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'DUPLICATE', 'IMPORTED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'REVIEWED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SimilarityType" AS ENUM ('EDITORIAL', 'GENRE', 'STYLE', 'AUDIENCE', 'COLLABORATION', 'AI_SUGGESTED');

-- CreateEnum
CREATE TYPE "RelationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TrackCreditType" AS ENUM ('PRIMARY_ARTIST', 'FEATURED_ARTIST', 'REMIXER', 'PRODUCER', 'COMPOSER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "role" "UserRole" NOT NULL DEFAULT 'READER',
    "securityVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "isoCode" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "djs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "realName" TEXT,
    "shortBio" TEXT,
    "longBio" TEXT,
    "countryId" TEXT,
    "cityId" TEXT,
    "activeFrom" INTEGER,
    "activeTo" INTEGER,
    "activityStatus" "ActivityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "djs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dj_aliases" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "aliasType" "AliasType" NOT NULL DEFAULT 'ALTERNATIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dj_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "history" TEXT,
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre_relations" (
    "id" TEXT NOT NULL,
    "sourceGenreId" TEXT NOT NULL,
    "targetGenreId" TEXT NOT NULL,
    "weight" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genre_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dj_genres" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    "sourceId" TEXT,
    "role" "GenreRole" NOT NULL DEFAULT 'SECONDARY',
    "weight" INTEGER,
    "confidence" DECIMAL(5,4),
    "editorialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dj_genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivals" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "countryId" TEXT,
    "cityId" TEXT,
    "officialUrl" TEXT,
    "foundedYear" INTEGER,
    "activityStatus" "ActivityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festival_editions" (
    "id" TEXT NOT NULL,
    "festivalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "officialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festival_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festival_appearances" (
    "id" TEXT NOT NULL,
    "festivalEditionId" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "sourceId" TEXT,
    "stage" TEXT,
    "performanceDate" TIMESTAMP(3),
    "billingPosition" INTEGER,
    "isHeadliner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festival_appearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rankingType" "RankingType" NOT NULL,
    "methodology" TEXT,
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_editions" (
    "id" TEXT NOT NULL,
    "rankingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "year" INTEGER,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_entries" (
    "id" TEXT NOT NULL,
    "rankingEditionId" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "previousPosition" INTEGER,
    "score" DECIMAL(10,4),
    "editorialNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "platform" "ExternalPlatform" NOT NULL,
    "externalUrl" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3),
    "externalPublishedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "description" TEXT,
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "articleType" "ArticleType" NOT NULL,
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_djs" (
    "articleId" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_djs_pkey" PRIMARY KEY ("articleId","djId")
);

-- CreateTable
CREATE TABLE "article_genres" (
    "articleId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_genres_pkey" PRIMARY KEY ("articleId","genreId")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER NOT NULL,
    "altText" TEXT,
    "credit" TEXT,
    "sourceUrl" TEXT,
    "license" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dj_media" (
    "djId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dj_media_pkey" PRIMARY KEY ("djId","mediaAssetId","role")
);

-- CreateTable
CREATE TABLE "social_profiles" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT,
    "url" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_profiles" (
    "id" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "provider" "ExternalPlatform" NOT NULL,
    "externalId" TEXT,
    "url" TEXT NOT NULL,
    "metadata" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "publisher" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dj_sources" (
    "djId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dj_sources_pkey" PRIMARY KEY ("djId","sourceId")
);

-- CreateTable
CREATE TABLE "favorites" (
    "userId" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId","djId")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ipHash" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "checksum" TEXT,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "rawData" JSONB NOT NULL,
    "normalizedData" JSONB,
    "validationErrors" JSONB,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" TEXT NOT NULL,
    "reviewedById" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "validationStatus" "AiValidationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenUsage" JSONB,
    "estimatedCost" DECIMAL(12,6),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dj_similarities" (
    "id" TEXT NOT NULL,
    "sourceDjId" TEXT NOT NULL,
    "targetDjId" TEXT NOT NULL,
    "similarityType" "SimilarityType" NOT NULL,
    "score" DECIMAL(5,4),
    "explanation" TEXT,
    "generatedBy" TEXT,
    "reviewStatus" "RelationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dj_similarities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "isrc" TEXT,
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_credits" (
    "trackId" TEXT NOT NULL,
    "djId" TEXT NOT NULL,
    "creditType" "TrackCreditType" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_credits_pkey" PRIMARY KEY ("trackId","djId","creditType")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "countryId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "officialUrl" TEXT,
    "editorialStatus" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dj_labels" (
    "djId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "role" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dj_labels_pkey" PRIMARY KEY ("djId","labelId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "countries_isoCode_key" ON "countries"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "countries_slug_key" ON "countries"("slug");

-- CreateIndex
CREATE INDEX "countries_name_idx" ON "countries"("name");

-- CreateIndex
CREATE INDEX "cities_countryId_name_idx" ON "cities"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "cities_countryId_slug_key" ON "cities"("countryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "djs_slug_key" ON "djs"("slug");

-- CreateIndex
CREATE INDEX "djs_normalizedName_idx" ON "djs"("normalizedName");

-- CreateIndex
CREATE INDEX "djs_editorialStatus_publishedAt_idx" ON "djs"("editorialStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "djs_countryId_idx" ON "djs"("countryId");

-- CreateIndex
CREATE INDEX "djs_cityId_idx" ON "djs"("cityId");

-- CreateIndex
CREATE INDEX "djs_deletedAt_idx" ON "djs"("deletedAt");

-- CreateIndex
CREATE INDEX "dj_aliases_normalizedName_idx" ON "dj_aliases"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "dj_aliases_djId_normalizedName_key" ON "dj_aliases"("djId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE INDEX "genres_normalizedName_idx" ON "genres"("normalizedName");

-- CreateIndex
CREATE INDEX "genres_parentId_idx" ON "genres"("parentId");

-- CreateIndex
CREATE INDEX "genres_editorialStatus_publishedAt_idx" ON "genres"("editorialStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "genre_relations_targetGenreId_idx" ON "genre_relations"("targetGenreId");

-- CreateIndex
CREATE UNIQUE INDEX "genre_relations_sourceGenreId_targetGenreId_key" ON "genre_relations"("sourceGenreId", "targetGenreId");

-- CreateIndex
CREATE INDEX "dj_genres_genreId_role_idx" ON "dj_genres"("genreId", "role");

-- CreateIndex
CREATE INDEX "dj_genres_sourceId_idx" ON "dj_genres"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "dj_genres_djId_genreId_key" ON "dj_genres"("djId", "genreId");

-- CreateIndex
CREATE UNIQUE INDEX "festivals_slug_key" ON "festivals"("slug");

-- CreateIndex
CREATE INDEX "festivals_normalizedName_idx" ON "festivals"("normalizedName");

-- CreateIndex
CREATE INDEX "festivals_countryId_idx" ON "festivals"("countryId");

-- CreateIndex
CREATE INDEX "festivals_cityId_idx" ON "festivals"("cityId");

-- CreateIndex
CREATE INDEX "festivals_editorialStatus_publishedAt_idx" ON "festivals"("editorialStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "festival_editions_year_idx" ON "festival_editions"("year");

-- CreateIndex
CREATE UNIQUE INDEX "festival_editions_festivalId_year_key" ON "festival_editions"("festivalId", "year");

-- CreateIndex
CREATE INDEX "festival_appearances_djId_idx" ON "festival_appearances"("djId");

-- CreateIndex
CREATE INDEX "festival_appearances_sourceId_idx" ON "festival_appearances"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "festival_appearances_festivalEditionId_djId_performanceDate_key" ON "festival_appearances"("festivalEditionId", "djId", "performanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_slug_key" ON "rankings"("slug");

-- CreateIndex
CREATE INDEX "rankings_rankingType_idx" ON "rankings"("rankingType");

-- CreateIndex
CREATE INDEX "rankings_editorialStatus_publishedAt_idx" ON "rankings"("editorialStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "ranking_editions_year_idx" ON "ranking_editions"("year");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_editions_rankingId_label_key" ON "ranking_editions"("rankingId", "label");

-- CreateIndex
CREATE INDEX "ranking_entries_djId_idx" ON "ranking_entries"("djId");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_entries_rankingEditionId_position_key" ON "ranking_entries"("rankingEditionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_entries_rankingEditionId_djId_key" ON "ranking_entries"("rankingEditionId", "djId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_slug_key" ON "sessions"("slug");

-- CreateIndex
CREATE INDEX "sessions_djId_editorialStatus_idx" ON "sessions"("djId", "editorialStatus");

-- CreateIndex
CREATE INDEX "sessions_platform_idx" ON "sessions"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_authorId_idx" ON "articles"("authorId");

-- CreateIndex
CREATE INDEX "articles_articleType_idx" ON "articles"("articleType");

-- CreateIndex
CREATE INDEX "articles_editorialStatus_publishedAt_idx" ON "articles"("editorialStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "article_djs_djId_idx" ON "article_djs"("djId");

-- CreateIndex
CREATE INDEX "article_genres_genreId_idx" ON "article_genres"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "media_assets_mediaType_status_idx" ON "media_assets"("mediaType", "status");

-- CreateIndex
CREATE INDEX "dj_media_mediaAssetId_idx" ON "dj_media"("mediaAssetId");

-- CreateIndex
CREATE INDEX "social_profiles_platform_idx" ON "social_profiles"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "social_profiles_djId_platform_url_key" ON "social_profiles"("djId", "platform", "url");

-- CreateIndex
CREATE INDEX "external_profiles_provider_idx" ON "external_profiles"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "external_profiles_djId_provider_url_key" ON "external_profiles"("djId", "provider", "url");

-- CreateIndex
CREATE UNIQUE INDEX "external_profiles_provider_externalId_key" ON "external_profiles"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "sources_url_key" ON "sources"("url");

-- CreateIndex
CREATE INDEX "sources_sourceType_idx" ON "sources"("sourceType");

-- CreateIndex
CREATE INDEX "sources_verificationStatus_idx" ON "sources"("verificationStatus");

-- CreateIndex
CREATE INDEX "dj_sources_sourceId_idx" ON "dj_sources"("sourceId");

-- CreateIndex
CREATE INDEX "favorites_djId_idx" ON "favorites"("djId");

-- CreateIndex
CREATE INDEX "audit_events_actorUserId_idx" ON "audit_events"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_idx" ON "audit_events"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- CreateIndex
CREATE INDEX "import_jobs_createdById_idx" ON "import_jobs"("createdById");

-- CreateIndex
CREATE INDEX "import_jobs_status_createdAt_idx" ON "import_jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "import_rows_status_idx" ON "import_rows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "import_rows_importJobId_rowNumber_key" ON "import_rows"("importJobId", "rowNumber");

-- CreateIndex
CREATE INDEX "ai_generations_taskType_promptVersion_idx" ON "ai_generations"("taskType", "promptVersion");

-- CreateIndex
CREATE INDEX "ai_generations_inputHash_idx" ON "ai_generations"("inputHash");

-- CreateIndex
CREATE INDEX "ai_generations_validationStatus_idx" ON "ai_generations"("validationStatus");

-- CreateIndex
CREATE INDEX "dj_similarities_targetDjId_idx" ON "dj_similarities"("targetDjId");

-- CreateIndex
CREATE INDEX "dj_similarities_reviewStatus_idx" ON "dj_similarities"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "dj_similarities_sourceDjId_targetDjId_similarityType_key" ON "dj_similarities"("sourceDjId", "targetDjId", "similarityType");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_slug_key" ON "tracks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_isrc_key" ON "tracks"("isrc");

-- CreateIndex
CREATE INDEX "tracks_normalizedTitle_idx" ON "tracks"("normalizedTitle");

-- CreateIndex
CREATE INDEX "tracks_editorialStatus_publishedAt_idx" ON "tracks"("editorialStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "track_credits_djId_idx" ON "track_credits"("djId");

-- CreateIndex
CREATE UNIQUE INDEX "labels_slug_key" ON "labels"("slug");

-- CreateIndex
CREATE INDEX "labels_normalizedName_idx" ON "labels"("normalizedName");

-- CreateIndex
CREATE INDEX "labels_countryId_idx" ON "labels"("countryId");

-- CreateIndex
CREATE INDEX "dj_labels_labelId_idx" ON "dj_labels"("labelId");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "djs" ADD CONSTRAINT "djs_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "djs" ADD CONSTRAINT "djs_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_aliases" ADD CONSTRAINT "dj_aliases_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genres" ADD CONSTRAINT "genres_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_relations" ADD CONSTRAINT "genre_relations_sourceGenreId_fkey" FOREIGN KEY ("sourceGenreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genre_relations" ADD CONSTRAINT "genre_relations_targetGenreId_fkey" FOREIGN KEY ("targetGenreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_genres" ADD CONSTRAINT "dj_genres_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_genres" ADD CONSTRAINT "dj_genres_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_genres" ADD CONSTRAINT "dj_genres_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festivals" ADD CONSTRAINT "festivals_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festivals" ADD CONSTRAINT "festivals_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festival_editions" ADD CONSTRAINT "festival_editions_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festival_appearances" ADD CONSTRAINT "festival_appearances_festivalEditionId_fkey" FOREIGN KEY ("festivalEditionId") REFERENCES "festival_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festival_appearances" ADD CONSTRAINT "festival_appearances_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festival_appearances" ADD CONSTRAINT "festival_appearances_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_editions" ADD CONSTRAINT "ranking_editions_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_rankingEditionId_fkey" FOREIGN KEY ("rankingEditionId") REFERENCES "ranking_editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_djs" ADD CONSTRAINT "article_djs_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_djs" ADD CONSTRAINT "article_djs_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_genres" ADD CONSTRAINT "article_genres_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_genres" ADD CONSTRAINT "article_genres_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_media" ADD CONSTRAINT "dj_media_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_media" ADD CONSTRAINT "dj_media_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_profiles" ADD CONSTRAINT "external_profiles_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_sources" ADD CONSTRAINT "dj_sources_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_sources" ADD CONSTRAINT "dj_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_similarities" ADD CONSTRAINT "dj_similarities_sourceDjId_fkey" FOREIGN KEY ("sourceDjId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_similarities" ADD CONSTRAINT "dj_similarities_targetDjId_fkey" FOREIGN KEY ("targetDjId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_credits" ADD CONSTRAINT "track_credits_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_credits" ADD CONSTRAINT "track_credits_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_labels" ADD CONSTRAINT "dj_labels_djId_fkey" FOREIGN KEY ("djId") REFERENCES "djs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dj_labels" ADD CONSTRAINT "dj_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
