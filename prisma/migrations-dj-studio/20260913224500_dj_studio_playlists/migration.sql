-- DJ Studio M3: Organization-scoped playlists + playlist_items
-- Additive only. No backfill, RLS, permissions, or legacy cleanup.
-- Tenant integrity pending (M4 / SQL companion):
--   playlist_items (organization_id, playlist_id) → playlists(organization_id, id)
--   playlist_items (organization_id, library_item_id) → library_items(organization_id, id)
-- Parent UNIQUE (organization_id, id) on playlists already exists for that.
-- Repeated LibraryItem in one Playlist is allowed (no unique on library_item_id).

-- CreateTable
CREATE TABLE "playlists" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
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
CREATE TABLE "playlist_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "playlist_id" UUID NOT NULL,
    "library_item_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "added_by_profile_id" UUID,
    "notes" TEXT,
    "transition_notes" TEXT,
    "source_timestamp_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playlists_organization_updated_at_idx" ON "playlists"("organization_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "playlists_visibility_idx" ON "playlists"("visibility");

-- CreateIndex
CREATE INDEX "playlists_playlist_type_idx" ON "playlists"("playlist_type");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_organization_slug_unique" ON "playlists"("organization_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_organization_id_unique" ON "playlists"("organization_id", "id");

-- CreateIndex
CREATE INDEX "playlist_items_organization_idx" ON "playlist_items"("organization_id");

-- CreateIndex
CREATE INDEX "playlist_items_playlist_position_idx" ON "playlist_items"("playlist_id", "position");

-- CreateIndex
CREATE INDEX "playlist_items_library_item_idx" ON "playlist_items"("library_item_id");

-- CreateIndex
CREATE INDEX "playlist_items_added_by_idx" ON "playlist_items"("added_by_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlist_position_unique" ON "playlist_items"("playlist_id", "position");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_added_by_profile_id_fkey" FOREIGN KEY ("added_by_profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

