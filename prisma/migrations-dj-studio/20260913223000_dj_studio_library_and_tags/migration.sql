-- DJ Studio M2: Organization-scoped library_items + tags + library_item_tags
-- Additive only. No backfill, RLS, playlists, or Profile cleanup.
-- Tenant integrity pending (not in this migration):
--   library_item_tags (organization_id, library_item_id)
--     → library_items (organization_id, id)
--   library_item_tags (organization_id, tag_id)
--     → tags (organization_id, id)
-- Parent UNIQUE (organization_id, id) on library_items and tags already exist.

-- CreateTable
CREATE TABLE "library_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "track_id" UUID NOT NULL,
    "added_by_profile_id" UUID,
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

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "normalized_name" VARCHAR(80) NOT NULL,
    "color" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_item_tags" (
    "organization_id" UUID NOT NULL,
    "library_item_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "library_item_tags_pkey" PRIMARY KEY ("library_item_id","tag_id")
);

-- CreateIndex
CREATE INDEX "library_items_organization_date_added_idx" ON "library_items"("organization_id", "date_added" DESC);

-- CreateIndex
CREATE INDEX "library_items_organization_status_idx" ON "library_items"("organization_id", "status");

-- CreateIndex
CREATE INDEX "library_items_organization_is_favorite_idx" ON "library_items"("organization_id", "is_favorite");

-- CreateIndex
CREATE INDEX "library_items_track_idx" ON "library_items"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_items_organization_track_unique" ON "library_items"("organization_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_items_organization_id_unique" ON "library_items"("organization_id", "id");

-- CreateIndex
CREATE INDEX "tags_organization_idx" ON "tags"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organization_normalized_name_unique" ON "tags"("organization_id", "normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organization_id_unique" ON "tags"("organization_id", "id");

-- CreateIndex
CREATE INDEX "library_item_tags_organization_idx" ON "library_item_tags"("organization_id");

-- CreateIndex
CREATE INDEX "library_item_tags_tag_idx" ON "library_item_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_added_by_profile_id_fkey" FOREIGN KEY ("added_by_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_item_tags" ADD CONSTRAINT "library_item_tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_item_tags" ADD CONSTRAINT "library_item_tags_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_item_tags" ADD CONSTRAINT "library_item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

