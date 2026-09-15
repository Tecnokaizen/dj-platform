import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
import { hasDjStudioPermission } from '@/domains/dj-studio/permissions/has-dj-studio-permission'
import { DJ_STUDIO_PERMISSION_KEYS } from '@/domains/dj-studio/permissions/permission-keys'
import {
  ensurePersonalOrganization,
  personalOrganizationSlug,
} from '@/domains/dj-studio/organization/ensure-personal-organization'
import { createResolveActiveOrganizationService } from '@/domains/dj-studio/organization/resolve-active-organization'
import {
  addTrackToLibrary,
  listLibraryItems,
  removeLibraryItem,
} from '@/domains/dj-studio/library/services/library-item-services'
import {
  addPlaylistItem,
  createPlaylist,
  getPlaylist,
  listPlaylists,
  reorderPlaylistItems,
} from '@/domains/dj-studio/playlists/services/playlist-services'
import {
  getDjStudioProfile,
  upsertDjStudioProfile,
} from '@/domains/dj-studio/profile/services/dj-studio-profile-services'
import {
  DJ_STUDIO_ERROR_CODES,
  DjStudioError,
} from '@/domains/dj-studio/shared/errors'
import {
  DJ_STUDIO_PUBLIC_NOTICE_CODES,
  mapDjStudioErrorToPublicNotice,
} from '@/domains/dj-studio/shared/public-notice'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'

const PREFIX = 'm7-dj-'

async function cleanup() {
  const { prisma } = await import('@/lib/prisma')
  const profiles = await prisma.profile.findMany({
    where: { username: { startsWith: PREFIX } },
    select: { id: true },
  })
  const orgIds = new Set<string>()

  for (const profile of profiles) {
    const memberships = await prisma.organizationMembership.findMany({
      where: { profileId: profile.id },
      select: { organizationId: true },
    })
    for (const membership of memberships) {
      orgIds.add(membership.organizationId)
    }
    orgIds.add(
      (
        await prisma.organization.findUnique({
          where: { slug: personalOrganizationSlug(profile.id) },
          select: { id: true },
        })
      )?.id ?? '',
    )
  }

  const organizations = [...orgIds].filter(Boolean)

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

  await prisma.djStudioProfile.deleteMany({
    where: { profileId: { in: profiles.map((profile) => profile.id) } },
  })

  await prisma.$transaction(async (client) => {
    if (organizations.length > 0) {
      await client.organizationMembership.deleteMany({
        where: { organizationId: { in: organizations } },
      })
      await client.organization.deleteMany({
        where: { id: { in: organizations } },
      })
    }
    await client.profile.deleteMany({
      where: { id: { in: profiles.map((profile) => profile.id) } },
    })
  })

  await prisma.track.deleteMany({ where: { title: { startsWith: PREFIX } } })
}

async function createProfile(label: string) {
  const { prisma } = await import('@/lib/prisma')
  return prisma.profile.create({
    data: {
      id: randomUUID(),
      username: `${PREFIX}${label}-${randomUUID().slice(0, 8)}`,
      displayName: `DJ ${label}`,
    },
  })
}

async function createTrack(label: string) {
  const { prisma } = await import('@/lib/prisma')
  const title = `${PREFIX}${label}-${randomUUID().slice(0, 6)}`
  return prisma.track.create({
    data: {
      title,
      normalizedTitle: title.toLowerCase(),
    },
  })
}

async function ownerContext(
  profileId: string,
): Promise<ActiveOrganizationContext> {
  return ensurePersonalOrganization(profileId)
}

async function viewerContextOnOwnerOrg(
  ownerProfileId: string,
  viewerProfileId: string,
): Promise<ActiveOrganizationContext> {
  const { prisma } = await import('@/lib/prisma')
  const owner = await ensurePersonalOrganization(ownerProfileId)
  const viewerRole = await prisma.role.findUniqueOrThrow({
    where: { key: SYSTEM_ROLE_KEYS.VIEWER },
  })

  await prisma.organizationMembership.create({
    data: {
      organizationId: owner.organizationId,
      profileId: viewerProfileId,
      roleId: viewerRole.id,
      status: 'ACTIVE',
    },
  })

  const membershipRepository = createMembershipRepository(prisma)
  const resolve = createResolveOrganizationContextService({
    getCurrentProfileId: async () => viewerProfileId,
    findOrganizationById,
    findRoleById,
    findActiveMembership: (organizationId, profileId) =>
      membershipRepository.findActiveByOrganizationAndProfile(
        organizationId,
        profileId,
      ),
  })

  return resolve(owner.organizationId)
}

describe('DJ Studio M7 Product integration (services)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    const { prisma } = await import('@/lib/prisma')
    await seedSystemRoles(prisma)
    await prisma.$transaction((client) => syncPermissionsFoundation(client))
    await prisma.$transaction((client) => seedDjStudioDomainPermissions(client))
    await cleanup()
  }, 60_000)

  afterAll(async () => {
    await cleanup()
    const { prisma } = await import('@/lib/prisma')
    await prisma.$disconnect()
  })

  it('0 memberships → resolve creates personal org', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('zero')

    const resolve = createResolveActiveOrganizationService({
      getCurrentProfileId: async () => profile.id,
      listActiveMembershipsOrdered: async (profileId) =>
        prisma.organizationMembership.findMany({
          where: {
            profileId,
            status: 'ACTIVE',
            organization: { status: 'ACTIVE' },
          },
          select: {
            id: true,
            organizationId: true,
            profileId: true,
            roleId: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: 'asc' }, { organizationId: 'asc' }],
        }),
      readPreferredOrganizationId: async () => null,
      ensurePersonalOrganization,
      resolveOrganizationContext: async (organizationId, profileId) => {
        const membershipRepository = createMembershipRepository(prisma)
        return createResolveOrganizationContextService({
          getCurrentProfileId: async () => profileId,
          findOrganizationById,
          findRoleById,
          findActiveMembership: (orgId, pid) =>
            membershipRepository.findActiveByOrganizationAndProfile(orgId, pid),
        })(organizationId)
      },
    })

    const context = await resolve()
    expect(context.profileId).toBe(profile.id)
    const orgs = await prisma.organization.findMany({
      where: { slug: personalOrganizationSlug(profile.id) },
    })
    expect(orgs).toHaveLength(1)
  })

  it('library list is active-org only; VIEWER can read, manage denied', async () => {
    const ownerProfile = await createProfile('lib-owner')
    const viewerProfile = await createProfile('lib-viewer')
    const track = await createTrack('lib')
    const owner = await ownerContext(ownerProfile.id)
    const item = await addTrackToLibrary(owner, track.id)

    const other = await ownerContext((await createProfile('other')).id)
    const otherList = await listLibraryItems(other)
    expect(otherList.some((row) => row.id === item.id)).toBe(false)

    const viewer = await viewerContextOnOwnerOrg(
      ownerProfile.id,
      viewerProfile.id,
    )
    await expect(listLibraryItems(viewer)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: item.id })]),
    )
    expect(
      await hasDjStudioPermission(
        viewer,
        DJ_STUDIO_PERMISSION_KEYS.LIBRARY_MANAGE,
      ),
    ).toBe(false)
    await expect(addTrackToLibrary(viewer, track.id)).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.FORBIDDEN,
    })
  })

  it('add track + duplicate idempotent; playlist repeat + reorder', async () => {
    const profile = await createProfile('flow')
    const track = await createTrack('flow')
    const ctx = await ownerContext(profile.id)

    const first = await addTrackToLibrary(ctx, track.id)
    const second = await addTrackToLibrary(ctx, track.id)
    expect(second.id).toBe(first.id)

    const playlist = await createPlaylist(ctx, {
      name: 'M7 Set',
      slug: `${PREFIX}set-${randomUUID().slice(0, 6)}`,
    })
    const a = await addPlaylistItem(ctx, playlist.id, {
      libraryItemId: first.id,
    })
    const b = await addPlaylistItem(ctx, playlist.id, {
      libraryItemId: first.id,
    })
    expect(a.libraryItemId).toBe(b.libraryItemId)

    const reordered = await reorderPlaylistItems(ctx, playlist.id, [
      b.id,
      a.id,
    ])
    expect(reordered.map((row) => row.id)).toEqual([b.id, a.id])

    const listed = await listPlaylists(ctx)
    expect(listed.some((row) => row.id === playlist.id)).toBe(true)
    expect(listed.find((row) => row.id === playlist.id)?._count.items).toBe(2)
  })

  it('cross-org playlist access denied', async () => {
    const profileA = await createProfile('pla')
    const profileB = await createProfile('plb')
    const ctxA = await ownerContext(profileA.id)
    const ctxB = await ownerContext(profileB.id)
    const playlist = await createPlaylist(ctxA, {
      name: 'Private A',
      slug: `${PREFIX}xa-${randomUUID().slice(0, 6)}`,
    })

    await expect(getPlaylist(ctxB, playlist.id)).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.PLAYLIST_NOT_FOUND,
    })
  })

  it('Studio Profile save does not update Profile.djName', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('studio')
    await prisma.profile.update({
      where: { id: profile.id },
      data: { djName: 'Keep Legacy' },
    })

    await upsertDjStudioProfile(profile.id, {
      stageName: 'M7 Stage',
      experienceLevel: 'INTERMEDIATE',
    })

    const studio = await getDjStudioProfile(profile.id)
    expect(studio?.stageName).toBe('M7 Stage')

    const legacy = await prisma.profile.findUniqueOrThrow({
      where: { id: profile.id },
      select: { djName: true },
    })
    expect(legacy.djName).toBe('Keep Legacy')
  })

  it('organization switch prefers valid cookie and rejects invalid id', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('switch')
    const first = await ensurePersonalOrganization(profile.id)

    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { key: SYSTEM_ROLE_KEYS.MEMBER },
    })
    const ownerRole = await prisma.role.findUniqueOrThrow({
      where: { key: SYSTEM_ROLE_KEYS.OWNER },
    })
    const secondOwner = await createProfile('switch-owner')
    const secondOrg = await prisma.organization.create({
      data: {
        name: `${PREFIX}second`,
        slug: `${PREFIX}second-${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
        memberships: {
          create: {
            profileId: secondOwner.id,
            roleId: ownerRole.id,
            status: 'ACTIVE',
          },
        },
      },
    })
    await prisma.organizationMembership.create({
      data: {
        organizationId: secondOrg.id,
        profileId: profile.id,
        roleId: memberRole.id,
        status: 'ACTIVE',
      },
    })

    let preferred: string | null = secondOrg.id

    const resolve = createResolveActiveOrganizationService({
      getCurrentProfileId: async () => profile.id,
      listActiveMembershipsOrdered: async (profileId) =>
        prisma.organizationMembership.findMany({
          where: {
            profileId,
            status: 'ACTIVE',
            organization: { status: 'ACTIVE' },
          },
          select: {
            id: true,
            organizationId: true,
            profileId: true,
            roleId: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: 'asc' }, { organizationId: 'asc' }],
        }),
      readPreferredOrganizationId: async () => preferred,
      ensurePersonalOrganization,
      resolveOrganizationContext: async (organizationId, profileId) => {
        const membershipRepository = createMembershipRepository(prisma)
        return createResolveOrganizationContextService({
          getCurrentProfileId: async () => profileId,
          findOrganizationById,
          findRoleById,
          findActiveMembership: (orgId, pid) =>
            membershipRepository.findActiveByOrganizationAndProfile(orgId, pid),
        })(organizationId)
      },
    })

    const selected = await resolve()
    expect(selected.organizationId).toBe(secondOrg.id)

    preferred = randomUUID()
    const fallback = await resolve()
    expect(fallback.organizationId).toBe(first.organizationId)

    const membershipRepository = createMembershipRepository(prisma)
    const resolveCtx = createResolveOrganizationContextService({
      getCurrentProfileId: async () => profile.id,
      findOrganizationById,
      findRoleById,
      findActiveMembership: (orgId, pid) =>
        membershipRepository.findActiveByOrganizationAndProfile(orgId, pid),
    })
    await expect(resolveCtx(randomUUID())).rejects.toBeTruthy()
  })

  it('maps Domain errors to public Product notices', () => {
    expect(mapDjStudioErrorToPublicNotice(DJ_STUDIO_ERROR_CODES.FORBIDDEN)).toBe(
      DJ_STUDIO_PUBLIC_NOTICE_CODES.FORBIDDEN,
    )
    expect(
      mapDjStudioErrorToPublicNotice(DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_IN_USE),
    ).toBe(DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_IN_USE)
    expect(
      mapDjStudioErrorToPublicNotice(DJ_STUDIO_ERROR_CODES.TRACK_NOT_FOUND),
    ).toBe(DJ_STUDIO_PUBLIC_NOTICE_CODES.TRACK_NOT_FOUND)
  })

  it('remove library item blocked while in playlist (Product error path)', async () => {
    const profile = await createProfile('inuse')
    const track = await createTrack('inuse')
    const ctx = await ownerContext(profile.id)
    const item = await addTrackToLibrary(ctx, track.id)
    const playlist = await createPlaylist(ctx, {
      name: 'Hold',
      slug: `${PREFIX}hold-${randomUUID().slice(0, 6)}`,
    })
    await addPlaylistItem(ctx, playlist.id, { libraryItemId: item.id })

    try {
      await removeLibraryItem(ctx, item.id)
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(DjStudioError)
      expect(mapDjStudioErrorToPublicNotice((error as DjStudioError).code)).toBe(
        DJ_STUDIO_PUBLIC_NOTICE_CODES.LIBRARY_ITEM_IN_USE,
      )
    }
  })
})
