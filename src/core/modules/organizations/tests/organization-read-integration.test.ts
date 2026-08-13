import { describe, expect, it, vi } from 'vitest'

import { createListAuthorizedOrganizationsService } from '@/core/modules/organizations/services/list-authorized-organizations'

const ACTIVE_ORGANIZATION = {
  id: '087a70df-169f-44be-91f7-8a7356475803',
  name: 'Active Organization',
  slug: 'active-organization',
  status: 'ACTIVE' as const,
  logoUrl: null,
  locale: 'es',
  timezone: 'UTC',
  createdAt: new Date('2026-08-13T10:00:00.000Z'),
  updatedAt: new Date('2026-08-13T11:00:00.000Z'),
  archivedAt: null,
}

describe('Organization application read integration (O-017)', () => {
  it('requires organizations.read and returns DTOs with canUpdate', async () => {
    const findMany = vi.fn(async () => [
      { roleId: 'owner-role', organization: ACTIVE_ORGANIZATION },
      {
        roleId: 'viewer-role',
        organization: {
          ...ACTIVE_ORGANIZATION,
          id: 'f0b1c4b8-c68c-470d-8c8c-bb0944b735c8',
          name: 'Viewer Organization',
          slug: 'viewer-organization',
        },
      },
      {
        roleId: 'unmapped-role',
        organization: {
          ...ACTIVE_ORGANIZATION,
          id: '1ef5a1fb-1245-4cbf-923e-f88882219299',
          name: 'Unmapped Organization',
          slug: 'unmapped-organization',
        },
      },
    ])
    const list = createListAuthorizedOrganizationsService({
      getCurrentProfileId: async () => 'profile-id',
      runInTransaction: async (operation) =>
        operation({
          organizationMembership: { findMany } as never,
          rolePermission: {
            findMany: async () => [
              {
                roleId: 'owner-role',
                permission: { key: 'organizations.read' },
              },
              {
                roleId: 'owner-role',
                permission: { key: 'organizations.update' },
              },
              {
                roleId: 'viewer-role',
                permission: { key: 'organizations.read' },
              },
            ],
          } as never,
        }),
    })

    await expect(list()).resolves.toEqual([
      {
        organization: {
          ...ACTIVE_ORGANIZATION,
          createdAt: '2026-08-13T10:00:00.000Z',
          updatedAt: '2026-08-13T11:00:00.000Z',
          archivedAt: null,
        },
        canUpdate: true,
      },
      {
        organization: {
          ...ACTIVE_ORGANIZATION,
          id: 'f0b1c4b8-c68c-470d-8c8c-bb0944b735c8',
          name: 'Viewer Organization',
          slug: 'viewer-organization',
          createdAt: '2026-08-13T10:00:00.000Z',
          updatedAt: '2026-08-13T11:00:00.000Z',
          archivedAt: null,
        },
        canUpdate: false,
      },
    ])
    expect(findMany).toHaveBeenCalledTimes(1)
  })

  it('rejects a missing authenticated Profile before database access', async () => {
    let transactionOpened = false
    const list = createListAuthorizedOrganizationsService({
      getCurrentProfileId: async () => null,
      runInTransaction: async <Result>() => {
        transactionOpened = true
        return [] as Result
      },
    })

    await expect(list()).rejects.toMatchObject({
      name: 'ProfileError',
      code: 'PROFILE_NOT_FOUND',
    })
    expect(transactionOpened).toBe(false)
  })
})
