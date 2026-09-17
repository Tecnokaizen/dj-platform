import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { ensurePersonalOrganization } from '@/domains/dj-studio/organization/ensure-personal-organization'
import { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
import {
  SESSION_BUILDER_GENERATED_BY,
  SESSION_BUILDER_GENERATION_VERSION,
  saveSessionBuilderDraftAsPlaylist,
} from '@/domains/dj-studio/session-builder/services/save-session-builder-playlist'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'
import { prisma } from '@/lib/prisma'

const PREFIX = 'p6-save-'

async function cleanup() {
  const profiles = await prisma.profile.findMany({
    where: { username: { startsWith: PREFIX } },
    select: { id: true },
  })
  const orgIds = (
    await prisma.organizationMembership.findMany({
      where: { profileId: { in: profiles.map((profile) => profile.id) } },
      select: { organizationId: true },
    })
  ).map((membership) => membership.organizationId)

  const organizations = [...new Set(orgIds)].filter(Boolean)

  if (organizations.length > 0) {
    await prisma.playlistItem.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.playlist.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.libraryItemTag.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.tag.deleteMany({
      where: { organizationId: { in: organizations } },
    })
    await prisma.libraryItem.deleteMany({
      where: { organizationId: { in: organizations } },
    })
  }

  await prisma.$executeRawUnsafe('SET session_replication_role = replica')
  try {
    if (organizations.length > 0) {
      await prisma.organizationMembership.deleteMany({
        where: { organizationId: { in: organizations } },
      })
      await prisma.organization.deleteMany({
        where: { id: { in: organizations } },
      })
    }
    await prisma.profile.deleteMany({
      where: { id: { in: profiles.map((profile) => profile.id) } },
    })
  } finally {
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT')
  }

  const tracks = await prisma.track.findMany({
    where: { title: { startsWith: PREFIX } },
    select: { id: true },
  })
  const trackIds = tracks.map((track) => track.id)
  if (trackIds.length > 0) {
    await prisma.trackArtist.deleteMany({ where: { trackId: { in: trackIds } } })
    await prisma.track.deleteMany({ where: { id: { in: trackIds } } })
  }

  await prisma.artist.deleteMany({
    where: { slug: { startsWith: PREFIX } },
  })
}

async function createProfile(label: string) {
  return prisma.profile.create({
    data: {
      id: randomUUID(),
      username: `${PREFIX}${label}-${randomUUID().slice(0, 8)}`,
      displayName: `DJ ${label}`,
    },
  })
}

async function createTrack(label: string) {
  const title = `${PREFIX}${label}-${randomUUID().slice(0, 6)}`
  const artistName = `${PREFIX}artist-${label}`
  const artist = await prisma.artist.create({
    data: {
      name: artistName,
      normalizedName: artistName.toLowerCase(),
      slug: `${PREFIX}${label}-${randomUUID().slice(0, 8)}`,
    },
  })
  return prisma.track.create({
    data: {
      title,
      normalizedTitle: title.toLowerCase(),
      bpm: 120,
      camelotKey: '8A',
      durationMs: 180_000,
      artists: {
        create: {
          artistId: artist.id,
          role: 'PRIMARY',
          position: 0,
          creditedName: artist.name,
        },
      },
    },
  })
}

async function addLibraryItem(params: {
  organizationId: string
  profileId: string
  trackId: string
  status?: 'LIBRARY' | 'WISHLIST' | 'ARCHIVED' | 'REJECTED'
}) {
  return prisma.libraryItem.create({
    data: {
      organizationId: params.organizationId,
      trackId: params.trackId,
      addedByProfileId: params.profileId,
      status: params.status ?? 'LIBRARY',
      rating: 3,
      energy: 2,
      familiarity: 2,
    },
  })
}

async function counts(organizationId: string) {
  const [playlists, items] = await Promise.all([
    prisma.playlist.count({ where: { organizationId } }),
    prisma.playlistItem.count({ where: { organizationId } }),
  ])
  return { playlists, items }
}

describe('saveSessionBuilderDraftAsPlaylist (integration)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await seedSystemRoles(prisma)
    await prisma.$transaction((client) => syncPermissionsFoundation(client))
    await prisma.$transaction((client) => seedDjStudioDomainPermissions(client))
    await cleanup()
  }, 60_000)

  afterAll(async () => {
    await cleanup()
    await prisma.$disconnect()
  })

  it('saves AI_GENERATED playlist atomically with provenance', async () => {
    const owner = await createProfile('ok')
    const context = await ensurePersonalOrganization(owner.id)
    const trackA = await createTrack('a')
    const trackB = await createTrack('b')
    const trackC = await createTrack('c')
    const itemA = await addLibraryItem({
      organizationId: context.organizationId,
      profileId: owner.id,
      trackId: trackA.id,
    })
    const itemB = await addLibraryItem({
      organizationId: context.organizationId,
      profileId: owner.id,
      trackId: trackB.id,
    })
    const itemC = await addLibraryItem({
      organizationId: context.organizationId,
      profileId: owner.id,
      trackId: trackC.id,
    })

    const fixedNow = new Date('2026-09-16T12:00:00.000Z')
    const result = await saveSessionBuilderDraftAsPlaylist(
      context,
      {
        name: 'Propuesta de sesión',
        prompt: 'sunset afro house',
        tracks: [
          { libraryItemId: itemA.id, transitionNote: null },
          { libraryItemId: itemB.id, transitionNote: 'Transición B' },
          { libraryItemId: itemC.id, transitionNote: 'Transición C' },
        ],
      },
      { now: () => fixedNow },
    )

    const playlist = await prisma.playlist.findUniqueOrThrow({
      where: { id: result.playlistId },
      include: { items: { orderBy: { position: 'asc' } } },
    })

    expect(playlist.organizationId).toBe(context.organizationId)
    expect(playlist.playlistType).toBe('AI_GENERATED')
    expect(playlist.visibility).toBe('PRIVATE')
    expect(playlist.name).toBe('Propuesta de sesión')
    expect(playlist.slug).toBeNull()
    expect(playlist.metadata).toEqual({
      generatedBy: SESSION_BUILDER_GENERATED_BY,
      prompt: 'sunset afro house',
      generatedAt: '2026-09-16T12:00:00.000Z',
      generationVersion: SESSION_BUILDER_GENERATION_VERSION,
    })
    expect(playlist.items).toHaveLength(3)
    expect(playlist.items.map((item) => item.libraryItemId)).toEqual([
      itemA.id,
      itemB.id,
      itemC.id,
    ])
    expect(playlist.items.map((item) => item.position)).toEqual([0, 1, 2])
    expect(playlist.items.every((item) => item.organizationId === context.organizationId)).toBe(
      true,
    )
    expect(playlist.items.every((item) => item.addedByProfileId === context.profileId)).toBe(
      true,
    )
    expect(playlist.items[0].transitionNotes).toBeNull()
    expect(playlist.items[1].transitionNotes).toBe('Transición B')
    expect(playlist.items.every((item) => item.notes === null)).toBe(true)
  })

  it('denies VIEWER with zero writes', async () => {
    const owner = await createProfile('view-owner')
    const viewer = await createProfile('view-member')
    const ownerContext = await ensurePersonalOrganization(owner.id)
    const track = await createTrack('view')
    const item = await addLibraryItem({
      organizationId: ownerContext.organizationId,
      profileId: owner.id,
      trackId: track.id,
    })

    const viewerRole = await prisma.role.findUniqueOrThrow({
      where: { key: SYSTEM_ROLE_KEYS.VIEWER },
    })
    await prisma.organizationMembership.create({
      data: {
        organizationId: ownerContext.organizationId,
        profileId: viewer.id,
        roleId: viewerRole.id,
        status: 'ACTIVE',
      },
    })

    const membershipRepository = createMembershipRepository(prisma)
    const resolve = createResolveOrganizationContextService({
      getCurrentProfileId: async () => viewer.id,
      findOrganizationById,
      findRoleById,
      findActiveMembership: (organizationId, profileId) =>
        membershipRepository.findActiveByOrganizationAndProfile(
          organizationId,
          profileId,
        ),
    })
    const viewerContext = await resolve(ownerContext.organizationId)
    const before = await counts(ownerContext.organizationId)

    await expect(
      saveSessionBuilderDraftAsPlaylist(viewerContext, {
        name: 'Denied',
        prompt: 'sunset',
        tracks: [{ libraryItemId: item.id, transitionNote: null }],
      }),
    ).rejects.toMatchObject({ code: DJ_STUDIO_ERROR_CODES.FORBIDDEN })

    expect(await counts(ownerContext.organizationId)).toEqual(before)
  })

  it('rejects cross-tenant and non-LIBRARY items with zero writes', async () => {
    const ownerA = await createProfile('xa')
    const ownerB = await createProfile('xb')
    const ctxA = await ensurePersonalOrganization(ownerA.id)
    const ctxB = await ensurePersonalOrganization(ownerB.id)

    const trackA = await createTrack('xa')
    const trackB = await createTrack('xb')
    const trackWish = await createTrack('wish')
    const itemA = await addLibraryItem({
      organizationId: ctxA.organizationId,
      profileId: ownerA.id,
      trackId: trackA.id,
    })
    const itemB = await addLibraryItem({
      organizationId: ctxB.organizationId,
      profileId: ownerB.id,
      trackId: trackB.id,
    })
    const itemWish = await addLibraryItem({
      organizationId: ctxA.organizationId,
      profileId: ownerA.id,
      trackId: trackWish.id,
      status: 'WISHLIST',
    })

    const before = await counts(ctxA.organizationId)

    await expect(
      saveSessionBuilderDraftAsPlaylist(ctxA, {
        name: 'Cross',
        prompt: 'sunset',
        tracks: [
          { libraryItemId: itemA.id, transitionNote: null },
          { libraryItemId: itemB.id, transitionNote: null },
        ],
      }),
    ).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.SESSION_BUILDER_STALE_DRAFT,
    })

    await expect(
      saveSessionBuilderDraftAsPlaylist(ctxA, {
        name: 'Wish',
        prompt: 'sunset',
        tracks: [{ libraryItemId: itemWish.id, transitionNote: null }],
      }),
    ).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.SESSION_BUILDER_STALE_DRAFT,
    })

    await expect(
      saveSessionBuilderDraftAsPlaylist(ctxA, {
        name: 'Mixed',
        prompt: 'sunset',
        tracks: [
          { libraryItemId: itemA.id, transitionNote: null },
          { libraryItemId: itemWish.id, transitionNote: null },
        ],
      }),
    ).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.SESSION_BUILDER_STALE_DRAFT,
    })

    expect(await counts(ctxA.organizationId)).toEqual(before)
  })
})
