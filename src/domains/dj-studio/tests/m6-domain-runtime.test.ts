import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import { seedSystemRoles } from '@/core/modules/roles/seed/seed-system-roles'
import { syncPermissionsFoundation } from '@/core/modules/permissions/seed/sync-permissions-foundation'
import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { seedDjStudioDomainPermissions } from '@/domains/dj-studio/permissions/seed-dj-studio-permissions'
import {
  ensurePersonalOrganization,
  personalOrganizationSlug,
} from '@/domains/dj-studio/organization/ensure-personal-organization'
import {
  addTrackToLibrary,
  listLibraryItems,
  removeLibraryItem,
  updateLibraryItem,
} from '@/domains/dj-studio/library/services/library-item-services'
import {
  addTagToLibraryItem,
  createTag,
  listTags,
} from '@/domains/dj-studio/library/services/tag-services'
import { normalizeTagName } from '@/domains/dj-studio/library/validation/normalize-tag-name'
import {
  addPlaylistItem,
  createPlaylist,
  deletePlaylist,
  listPlaylists,
  reorderPlaylistItems,
} from '@/domains/dj-studio/playlists/services/playlist-services'
import {
  getDjStudioProfile,
  upsertDjStudioProfile,
} from '@/domains/dj-studio/profile/services/dj-studio-profile-services'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'
import type { ActiveOrganizationContext } from '@/domains/dj-studio/organization/types'
import { createResolveOrganizationContextService } from '@/core/modules/organizations/services/switch-active-organization'
import { createMembershipRepository } from '@/core/modules/memberships/repositories/membership-repository'
import { findOrganizationById } from '@/core/modules/organizations/services/find-organization-by-id'
import { findRoleById } from '@/core/modules/roles/services/find-role-by-id'

const PREFIX = 'm6-dj-'

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

describe('DJ Studio M6 Domain runtime (integration)', () => {
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

  it('ensurePersonalOrganization is idempotent and concurrency-safe', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('ensure')
    const [a, b] = await Promise.all([
      ensurePersonalOrganization(profile.id),
      ensurePersonalOrganization(profile.id),
    ])

    expect(a.organizationId).toBe(b.organizationId)
    const orgs = await prisma.organization.findMany({
      where: { slug: personalOrganizationSlug(profile.id) },
    })
    expect(orgs).toHaveLength(1)
    const owners = await prisma.organizationMembership.count({
      where: {
        organizationId: a.organizationId,
        status: 'ACTIVE',
        role: { key: SYSTEM_ROLE_KEYS.OWNER },
      },
    })
    expect(owners).toBe(1)
  })

  it('library manage works for OWNER and is denied for VIEWER', async () => {
    const ownerProfile = await createProfile('lib-owner')
    const viewerProfile = await createProfile('lib-viewer')
    const track = await createTrack('lib')
    const owner = await ownerContext(ownerProfile.id)
    const first = await addTrackToLibrary(owner, track.id)
    const second = await addTrackToLibrary(owner, track.id)
    expect(second.id).toBe(first.id)

    await updateLibraryItem(owner, first.id, { isFavorite: true, rating: 5 })
    const listed = await listLibraryItems(owner)
    expect(listed.some((item) => item.id === first.id)).toBe(true)

    const viewer = await viewerContextOnOwnerOrg(
      ownerProfile.id,
      viewerProfile.id,
    )
    await expect(listLibraryItems(viewer)).resolves.toHaveLength(listed.length)
    await expect(addTrackToLibrary(viewer, track.id)).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.FORBIDDEN,
    })
  })

  it('blocks cross-org library access and delete-in-use', async () => {
    const profileA = await createProfile('orga')
    const profileB = await createProfile('orgb')
    const track = await createTrack('xorg')
    const ctxA = await ownerContext(profileA.id)
    const ctxB = await ownerContext(profileB.id)
    const itemA = await addTrackToLibrary(ctxA, track.id)
    await addTrackToLibrary(ctxB, track.id)

    const fromB = await listLibraryItems(ctxB)
    expect(fromB.some((item) => item.id === itemA.id)).toBe(false)

    const playlist = await createPlaylist(ctxA, {
      name: 'In use',
      slug: `${PREFIX}in-use-${randomUUID().slice(0, 6)}`,
    })
    await addPlaylistItem(ctxA, playlist.id, { libraryItemId: itemA.id })
    await expect(removeLibraryItem(ctxA, itemA.id)).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.LIBRARY_ITEM_IN_USE,
    })
  })

  it('tags normalize and stay org-scoped', async () => {
    const profile = await createProfile('tags')
    const track = await createTrack('tags')
    const ctx = await ownerContext(profile.id)
    const item = await addTrackToLibrary(ctx, track.id)
    const tag = await createTag(ctx, { name: `${PREFIX} Warm Up` })
    expect(tag.normalizedName).toBe(normalizeTagName(`${PREFIX} Warm Up`))
    await addTagToLibraryItem(ctx, item.id, tag.id)
    const tags = await listTags(ctx)
    expect(tags.some((row) => row.id === tag.id)).toBe(true)

    await expect(
      createTag(ctx, { name: `${PREFIX} warm up` }),
    ).rejects.toMatchObject({ code: DJ_STUDIO_ERROR_CODES.TAG_NAME_CONFLICT })
  })

  it('playlists support repeats, reorder, and cascade delete', async () => {
    const profile = await createProfile('pl')
    const track = await createTrack('pl')
    const ctx = await ownerContext(profile.id)
    const item = await addTrackToLibrary(ctx, track.id)
    const playlist = await createPlaylist(ctx, {
      name: 'Set',
      slug: `${PREFIX}set-${randomUUID().slice(0, 6)}`,
    })
    const a = await addPlaylistItem(ctx, playlist.id, {
      libraryItemId: item.id,
    })
    const b = await addPlaylistItem(ctx, playlist.id, {
      libraryItemId: item.id,
    })
    expect(a.libraryItemId).toBe(b.libraryItemId)
    expect(a.position).not.toBe(b.position)

    const reordered = await reorderPlaylistItems(ctx, playlist.id, [
      b.id,
      a.id,
    ])
    expect(reordered.map((row) => row.id)).toEqual([b.id, a.id])
    expect(reordered.map((row) => row.position)).toEqual([0, 1])

    await deletePlaylist(ctx, playlist.id)
    const { prisma } = await import('@/lib/prisma')
    await expect(
      prisma.playlistItem.count({ where: { playlistId: playlist.id } }),
    ).resolves.toBe(0)
    await expect(listPlaylists(ctx)).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: playlist.id })]),
    )
  })

  it('DjStudioProfile upsert is own SoT and does not write Profile.djName', async () => {
    const { prisma } = await import('@/lib/prisma')
    const profile = await createProfile('djprof')
    await prisma.profile.update({
      where: { id: profile.id },
      data: { djName: 'Legacy Name' },
    })

    const upserted = await upsertDjStudioProfile(profile.id, {
      stageName: 'Stage Runtime',
      experienceLevel: 'ADVANCED',
    })
    expect(upserted.stageName).toBe('Stage Runtime')
    const again = await getDjStudioProfile(profile.id)
    expect(again?.stageName).toBe('Stage Runtime')

    const legacy = await prisma.profile.findUniqueOrThrow({
      where: { id: profile.id },
      select: { djName: true },
    })
    expect(legacy.djName).toBe('Legacy Name')
  })
})
