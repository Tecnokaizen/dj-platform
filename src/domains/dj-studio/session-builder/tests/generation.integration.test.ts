import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { ensurePersonalOrganization } from '@/domains/dj-studio/organization/ensure-personal-organization'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
import { generateSessionProposal } from '@/domains/dj-studio/session-builder/services/generate-session-proposal'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'
import type { PlaylistGenerationProvider } from '@/domains/dj-studio/session-builder/provider'
import { MockPlaylistGenerationProvider } from '@/lib/ai/providers/mock-playlist-generation-provider'
import { prisma } from '@/lib/prisma'

const PREFIX = 'p4-gen-'

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
}) {
  return prisma.libraryItem.create({
    data: {
      organizationId: params.organizationId,
      trackId: params.trackId,
      addedByProfileId: params.profileId,
      status: 'LIBRARY',
      rating: 3,
      energy: 2,
      familiarity: 2,
    },
  })
}

async function seedLibrary(context: ActiveOrganizationContext, count: number) {
  const items = []
  for (let index = 0; index < count; index += 1) {
    const { track } = await createTrackWithArtist(
      `${context.organizationId.slice(0, 4)}-${index}`,
      118 + (index % 5),
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

function generationInput() {
  return {
    prompt: 'sunset afro house',
    targetDurationMin: 90,
    energyCurve: 'gradual_rise' as const,
    source: 'library_only' as const,
    bpm: { start: 118, end: 123 },
    trackCountHint: 8,
  }
}

describe('generateSessionProposal (integration)', () => {
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

  it('generates a draft for OWNER with Mock and stays read-only', async () => {
    const ownerA = await createProfile('a')
    const ownerB = await createProfile('b')
    const ctxA = await ensurePersonalOrganization(ownerA.id)
    const ctxB = await ensurePersonalOrganization(ownerB.id)

    const itemsA = await seedLibrary(ctxA, 8)
    await seedLibrary(ctxB, 8)

    const beforePlaylists = await prisma.playlist.count({
      where: { organizationId: ctxA.organizationId },
    })
    const beforeItems = await prisma.playlistItem.count({
      where: { organizationId: ctxA.organizationId },
    })
    const beforeLibrary = await prisma.libraryItem.count({
      where: { organizationId: ctxA.organizationId },
    })

    const mock = new MockPlaylistGenerationProvider({ mode: 'success' })
    const generate = vi.spyOn(mock, 'generate')

    const draft = await generateSessionProposal({
      context: ctxA,
      input: generationInput(),
      provider: mock,
    })

    expect(generate).toHaveBeenCalledTimes(1)
    const request = generate.mock.calls[0][0]
    const idsA = new Set(itemsA.map((item) => item.id))
    expect(request.candidates.length).toBeGreaterThan(0)
    expect(request.candidates.length).toBeLessThanOrEqual(60)
    for (const candidate of request.candidates) {
      expect(idsA.has(candidate.libraryItemId)).toBe(true)
    }
    expect(request).not.toHaveProperty('organizationId')
    expect(request).not.toHaveProperty('profileId')

    expect(draft.tracks.length).toBeGreaterThan(0)
    expect(draft.title).toBe('Propuesta de sesión')

    expect(
      await prisma.playlist.count({
        where: { organizationId: ctxA.organizationId },
      }),
    ).toBe(beforePlaylists)
    expect(
      await prisma.playlistItem.count({
        where: { organizationId: ctxA.organizationId },
      }),
    ).toBe(beforeItems)
    expect(
      await prisma.libraryItem.count({
        where: { organizationId: ctxA.organizationId },
      }),
    ).toBe(beforeLibrary)
  })

  it('denies VIEWER before calling provider', async () => {
    const owner = await createProfile('view-owner')
    const viewer = await createProfile('view-member')
    const ownerContext = await ensurePersonalOrganization(owner.id)
    await seedLibrary(ownerContext, 8)

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

    const provider: PlaylistGenerationProvider = {
      generate: vi.fn(async () => {
        throw new Error('provider must not be called')
      }),
    }

    await expect(
      generateSessionProposal({
        context: viewerContext,
        input: generationInput(),
        provider,
      }),
    ).rejects.toMatchObject({ code: DJ_STUDIO_ERROR_CODES.FORBIDDEN })

    expect(provider.generate).not.toHaveBeenCalled()
  })
})
