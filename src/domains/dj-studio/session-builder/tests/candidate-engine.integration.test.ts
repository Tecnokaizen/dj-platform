import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
import { ensurePersonalOrganization } from '@/domains/dj-studio/organization/ensure-personal-organization'
import { buildSessionCandidateShortlist } from '@/domains/dj-studio/session-builder/services/build-session-candidate-shortlist'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import { createTag } from '@/domains/dj-studio/library/services/tag-services'
import { prisma } from '@/lib/prisma'

const PREFIX = 'p2-cand-'

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

  // OWNER invariant is enforced by triggers; replica role allows teardown.
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

async function createTrackWithArtist(label: string, bpm: number | null) {
  const title = `${PREFIX}${label}-${randomUUID().slice(0, 6)}`
  const artistName = `${PREFIX}artist-${label}`
  const artist = await prisma.artist.create({
    data: {
      name: artistName,
      normalizedName: artistName.toLowerCase(),
      slug: `${PREFIX}${label}-${randomUUID().slice(0, 8)}`,
    },
  })
  const track = await prisma.track.create({
    data: {
      title,
      normalizedTitle: title.toLowerCase(),
      bpm: bpm ?? undefined,
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
  return { track, artist }
}

async function addLibraryItem(params: {
  organizationId: string
  profileId: string
  trackId: string
  status?: 'LIBRARY' | 'WISHLIST' | 'ARCHIVED' | 'REJECTED'
  customBpm?: number | null
  customKey?: string | null
}) {
  return prisma.libraryItem.create({
    data: {
      organizationId: params.organizationId,
      trackId: params.trackId,
      addedByProfileId: params.profileId,
      status: params.status ?? 'LIBRARY',
      customBpm: params.customBpm ?? undefined,
      customKey: params.customKey ?? undefined,
      rating: 3,
      energy: 2,
      familiarity: 2,
    },
  })
}

async function seedLibrary(
  context: ActiveOrganizationContext,
  count: number,
  bpm = 120,
) {
  const items = []
  for (let index = 0; index < count; index += 1) {
    const { track } = await createTrackWithArtist(
      `${context.organizationId.slice(0, 4)}-${index}`,
      bpm,
    )
    items.push(
      await addLibraryItem({
        organizationId: context.organizationId,
        profileId: context.profileId,
        trackId: track.id,
      }),
    )
  }
  return items
}

describe('Session Builder candidate engine (integration)', () => {
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

  it('isolates candidates by Organization and LIBRARY status', async () => {
    const ownerA = await createProfile('a')
    const ownerB = await createProfile('b')
    const ctxA = await ensurePersonalOrganization(ownerA.id)
    const ctxB = await ensurePersonalOrganization(ownerB.id)

    await seedLibrary(ctxA, 8, 120)
    await seedLibrary(ctxB, 8, 128)

    const { track: wishTrack } = await createTrackWithArtist('wish', 120)
    await addLibraryItem({
      organizationId: ctxA.organizationId,
      profileId: ownerA.id,
      trackId: wishTrack.id,
      status: 'WISHLIST',
    })
    const { track: archivedTrack } = await createTrackWithArtist('arch', 120)
    await addLibraryItem({
      organizationId: ctxA.organizationId,
      profileId: ownerA.id,
      trackId: archivedTrack.id,
      status: 'ARCHIVED',
    })
    const { track: rejectedTrack } = await createTrackWithArtist('rej', 120)
    await addLibraryItem({
      organizationId: ctxA.organizationId,
      profileId: ownerA.id,
      trackId: rejectedTrack.id,
      status: 'REJECTED',
    })

    const shortlistA = await buildSessionCandidateShortlist(ctxA, {
      prompt: 'sunset set',
      energyCurve: 'steady',
    })
    const shortlistB = await buildSessionCandidateShortlist(ctxB, {
      prompt: 'sunset set',
      energyCurve: 'steady',
    })

    expect(shortlistA).toHaveLength(8)
    expect(shortlistB).toHaveLength(8)
    const idsA = new Set(shortlistA.map((item) => item.libraryItemId))
    for (const item of shortlistB) {
      expect(idsA.has(item.libraryItemId)).toBe(false)
    }
    expect(
      shortlistA.some((item) => item.trackId === wishTrack.id),
    ).toBe(false)
  })

  it('applies custom BPM/key precedence, tags, artists, and hard BPM window', async () => {
    const owner = await createProfile('meta')
    const context = await ensurePersonalOrganization(owner.id)
    await seedLibrary(context, 7, 120)

    const { track, artist } = await createTrackWithArtist('custom', 110)
    const item = await addLibraryItem({
      organizationId: context.organizationId,
      profileId: owner.id,
      trackId: track.id,
      customBpm: 121,
      customKey: '9a',
    })
    const tag = await createTag(context, { name: 'Afro House' })
    await prisma.libraryItemTag.create({
      data: {
        organizationId: context.organizationId,
        libraryItemId: item.id,
        tagId: tag.id,
      },
    })

    const shortlist = await buildSessionCandidateShortlist(context, {
      prompt: 'sunset afro house',
      energyCurve: 'warm_peak',
      bpm: { min: 118, max: 123 },
    })

    const found = shortlist.find((candidate) => candidate.libraryItemId === item.id)
    expect(found).toBeDefined()
    expect(found?.effectiveBpm).toBe(121)
    expect(found?.effectiveCamelotKey).toBe('9A')
    expect(found?.artists.some((entry) => entry.id === artist.id)).toBe(true)
    expect(found?.tags.some((entry) => entry.id === tag.id)).toBe(true)
    expect(found?.scoreBreakdown.tags).toBe(15)

    const { track: low } = await createTrackWithArtist('low', 110)
    await addLibraryItem({
      organizationId: context.organizationId,
      profileId: owner.id,
      trackId: low.id,
    })
    const filtered = await buildSessionCandidateShortlist(context, {
      prompt: 'sunset afro house',
      energyCurve: 'warm_peak',
      bpm: { min: 118, max: 123 },
    })
    expect(filtered.some((candidate) => candidate.trackId === low.id)).toBe(
      false,
    )
  })

  it('rejects when library.read is denied', async () => {
    const owner = await createProfile('deny-owner')
    const viewer = await createProfile('deny-viewer')
    const ownerContext = await ensurePersonalOrganization(owner.id)
    await seedLibrary(ownerContext, 8, 120)

    const viewerRole = await prisma.role.findUniqueOrThrow({
      where: { key: SYSTEM_ROLE_KEYS.VIEWER },
    })
    const libraryRead = await prisma.permission.findUniqueOrThrow({
      where: { key: 'library.read' },
    })

    await prisma.organizationMembership.create({
      data: {
        organizationId: ownerContext.organizationId,
        profileId: viewer.id,
        roleId: viewerRole.id,
        status: 'ACTIVE',
      },
    })

    const revoked = await prisma.rolePermission.findUniqueOrThrow({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: libraryRead.id,
        },
      },
    })
    await prisma.rolePermission.delete({ where: { id: revoked.id } })

    try {
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
      const deniedContext = await resolve(ownerContext.organizationId)

      await expect(
        buildSessionCandidateShortlist(deniedContext, {
          prompt: 'sunset',
          energyCurve: 'steady',
        }),
      ).rejects.toMatchObject({ code: DJ_STUDIO_ERROR_CODES.FORBIDDEN })
    } finally {
      await prisma.rolePermission.create({
        data: {
          roleId: viewerRole.id,
          permissionId: libraryRead.id,
        },
      })
    }
  })

  it('allows VIEWER with library.read to build shortlist', async () => {
    const owner = await createProfile('view-owner')
    const viewer = await createProfile('view-member')
    const ownerContext = await ensurePersonalOrganization(owner.id)
    await seedLibrary(ownerContext, 8, 120)

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

    const shortlist = await buildSessionCandidateShortlist(viewerContext, {
      prompt: 'sunset',
      energyCurve: 'steady',
    })
    expect(shortlist).toHaveLength(8)
  })
})
