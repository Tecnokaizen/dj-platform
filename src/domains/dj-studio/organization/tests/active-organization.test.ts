import { describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  }),
}))

import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { createResolveActiveOrganizationService } from '@/domains/dj-studio/organization/resolve-active-organization'
import {
  createEnsurePersonalOrganizationService,
  personalOrganizationSlug,
  pickDeterministicMembership,
} from '@/domains/dj-studio/organization/ensure-personal-organization'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'

const baseContext = {
  profileId: 'profile-1',
  organizationId: 'org-1',
  membershipId: 'mem-1',
  roleId: 'role-1',
  roleKey: SYSTEM_ROLE_KEYS.OWNER,
}

describe('pickDeterministicMembership', () => {
  it('orders by createdAt ASC then organizationId', () => {
    const chosen = pickDeterministicMembership([
      {
        createdAt: new Date('2026-01-02'),
        organizationId: 'b',
      },
      {
        createdAt: new Date('2026-01-01'),
        organizationId: 'z',
      },
      {
        createdAt: new Date('2026-01-01'),
        organizationId: 'a',
      },
    ])

    expect(chosen.organizationId).toBe('a')
  })
})

describe('personalOrganizationSlug', () => {
  it('is deterministic and PII-free', () => {
    expect(
      personalOrganizationSlug('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'),
    ).toBe('personal-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1')
  })
})

describe('ensurePersonalOrganization (unit)', () => {
  it('returns existing ACTIVE membership without creating', async () => {
    const createPersonalOrganization = vi.fn()
    const ensure = createEnsurePersonalOrganizationService({
      listActiveMembershipsOrdered: async () => [
        {
          id: 'm1',
          organizationId: 'org-existing',
          profileId: 'p1',
          roleId: 'r1',
          createdAt: new Date('2026-01-01'),
        },
      ],
      resolveOrganizationContext: async (organizationId, profileId) => ({
        ...baseContext,
        organizationId,
        profileId,
      }),
      findOrganizationBySlug: async () => null,
      createPersonalOrganization,
      getProfileDisplayName: async () => ({
        displayName: 'DJ',
        username: null,
      }),
    })

    const context = await ensure('p1')
    expect(context.organizationId).toBe('org-existing')
    expect(createPersonalOrganization).not.toHaveBeenCalled()
  })

  it('retries via slug conflict to existing org', async () => {
    const ensure = createEnsurePersonalOrganizationService({
      listActiveMembershipsOrdered: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'm1',
            organizationId: 'org-raced',
            profileId: 'p1',
            roleId: 'r1',
            createdAt: new Date(),
          },
        ]),
      resolveOrganizationContext: async (organizationId, profileId) => ({
        ...baseContext,
        organizationId,
        profileId,
      }),
      findOrganizationBySlug: async () => ({
        id: 'org-raced',
        name: 'Personal Studio',
      }),
      createPersonalOrganization: async () => {
        throw new OrganizationError(ORGANIZATION_ERROR_CODES.SLUG_CONFLICT)
      },
      getProfileDisplayName: async () => ({
        displayName: null,
        username: 'dj',
      }),
    })

    const context = await ensure('p1')
    expect(context.organizationId).toBe('org-raced')
  })
})

describe('resolveActiveOrganization (unit)', () => {
  it('creates personal org when memberships are empty', async () => {
    const ensurePersonalOrganization = vi.fn(async () => ({
      ...baseContext,
      organizationId: 'org-new',
    }))
    const persist = vi.fn()
    const resolve = createResolveActiveOrganizationService({
      getCurrentProfileId: async () => 'p1',
      listActiveMembershipsOrdered: async () => [],
      readPreferredOrganizationId: async () => null,
      persistPreferredOrganizationId: persist,
      ensurePersonalOrganization,
      resolveOrganizationContext: async () => baseContext,
    })

    const context = await resolve()
    expect(context.organizationId).toBe('org-new')
    expect(ensurePersonalOrganization).toHaveBeenCalledOnce()
    expect(persist).toHaveBeenCalledWith('org-new')
  })

  it('auto-selects the single ACTIVE membership', async () => {
    const resolve = createResolveActiveOrganizationService({
      getCurrentProfileId: async () => 'p1',
      listActiveMembershipsOrdered: async () => [
        {
          id: 'm1',
          organizationId: 'org-only',
          profileId: 'p1',
          roleId: 'r1',
          createdAt: new Date(),
        },
      ],
      readPreferredOrganizationId: async () => null,
      persistPreferredOrganizationId: vi.fn(),
      ensurePersonalOrganization: async () => {
        throw new Error('should not ensure')
      },
      resolveOrganizationContext: async (organizationId) => ({
        ...baseContext,
        organizationId,
      }),
    })

    const context = await resolve()
    expect(context.organizationId).toBe('org-only')
  })

  it('uses valid cookie when multiple memberships exist', async () => {
    const resolve = createResolveActiveOrganizationService({
      getCurrentProfileId: async () => 'p1',
      listActiveMembershipsOrdered: async () => [
        {
          id: 'm1',
          organizationId: 'org-a',
          profileId: 'p1',
          roleId: 'r1',
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'm2',
          organizationId: 'org-b',
          profileId: 'p1',
          roleId: 'r1',
          createdAt: new Date('2026-01-02'),
        },
      ],
      readPreferredOrganizationId: async () => 'org-b',
      persistPreferredOrganizationId: vi.fn(),
      ensurePersonalOrganization: async () => baseContext,
      resolveOrganizationContext: async (organizationId) => ({
        ...baseContext,
        organizationId,
      }),
    })

    const context = await resolve()
    expect(context.organizationId).toBe('org-b')
  })

  it('falls back deterministically when cookie is invalid', async () => {
    const persist = vi.fn()
    const resolve = createResolveActiveOrganizationService({
      getCurrentProfileId: async () => 'p1',
      listActiveMembershipsOrdered: async () => [
        {
          id: 'm1',
          organizationId: 'org-z',
          profileId: 'p1',
          roleId: 'r1',
          createdAt: new Date('2026-01-02'),
        },
        {
          id: 'm2',
          organizationId: 'org-a',
          profileId: 'p1',
          roleId: 'r1',
          createdAt: new Date('2026-01-01'),
        },
      ],
      readPreferredOrganizationId: async () => 'org-missing',
      persistPreferredOrganizationId: persist,
      ensurePersonalOrganization: async () => baseContext,
      resolveOrganizationContext: async (organizationId) => ({
        ...baseContext,
        organizationId,
      }),
    })

    const context = await resolve()
    expect(context.organizationId).toBe('org-a')
    expect(persist).toHaveBeenCalledWith('org-a')
  })

  it('rejects unauthenticated callers', async () => {
    const resolve = createResolveActiveOrganizationService({
      getCurrentProfileId: async () => null,
      listActiveMembershipsOrdered: async () => [],
      readPreferredOrganizationId: async () => null,
      persistPreferredOrganizationId: vi.fn(),
      ensurePersonalOrganization: async () => baseContext,
      resolveOrganizationContext: async () => baseContext,
    })

    await expect(resolve()).rejects.toMatchObject({
      code: DJ_STUDIO_ERROR_CODES.UNAUTHENTICATED,
    })
  })
})
