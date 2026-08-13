import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  assertOrganizationsTestDatabase,
  createOrganizationTestSlug,
} from '@/core/modules/organizations/tests/assert-test-database'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import type { Organization } from '@/core/modules/organizations/types/organization'
import type { OrganizationStatus } from '@/core/modules/organizations/types/organization-status'
import {
  createOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'

const TEST_PREFIX = 'o020-test-'

async function expectOrganizationError(
  promise: Promise<unknown>,
  code: (typeof ORGANIZATION_ERROR_CODES)[keyof typeof ORGANIZATION_ERROR_CODES]
): Promise<void> {
  try {
    await promise
    expect.unreachable('Expected OrganizationError to be thrown')
  } catch (error) {
    expect(error).toBeInstanceOf(OrganizationError)
    expect((error as OrganizationError).code).toBe(code)
  }
}

async function cleanupOrganizationTestRecords(): Promise<void> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')

  await deleteOrganizationTestRecords(prisma, {
    slug: { startsWith: TEST_PREFIX },
  })
}

async function countOrganizationTestRecords(): Promise<number> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')

  return prisma.organization.count({
    where: {
      slug: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

async function createActiveOrganization(
  name: string
): Promise<Organization> {
  return createOrganizationTestRecord({
    name,
    slug: createOrganizationTestSlug(TEST_PREFIX),
  })
}

async function reread(organizationId: string): Promise<Organization> {
  const { findOrganizationById } = await import(
    '@/core/modules/organizations/services/find-organization-by-id'
  )

  const found = await findOrganizationById(organizationId)
  expect(found).not.toBeNull()
  return found as Organization
}

async function assertUnchangedAfterInvalidTransition(params: {
  organizationId: string
  expectedStatus: OrganizationStatus
  expectedArchivedAt: Date | null
}): Promise<void> {
  const current = await reread(params.organizationId)

  expect(current.status).toBe(params.expectedStatus)

  if (params.expectedArchivedAt === null) {
    expect(current.archivedAt).toBeNull()
    return
  }

  expect(current.archivedAt).not.toBeNull()
  expect(current.archivedAt?.getTime()).toBe(
    params.expectedArchivedAt.getTime()
  )
}


async function organizationMutations() {
  const { prisma } = await import('@/lib/prisma')
  const { createArchiveOrganization } = await import(
    '@/core/modules/organizations/services/archive-organization'
  )
  const { createReactivateOrganization } = await import(
    '@/core/modules/organizations/services/reactivate-organization'
  )
  const { createRestoreOrganization } = await import(
    '@/core/modules/organizations/services/restore-organization'
  )
  const { createSuspendOrganization } = await import(
    '@/core/modules/organizations/services/suspend-organization'
  )

  return {
    archiveOrganization: createArchiveOrganization(prisma),
    reactivateOrganization: createReactivateOrganization(prisma),
    restoreOrganization: createRestoreOrganization(prisma),
    suspendOrganization: createSuspendOrganization(prisma),
  }
}

describe('Organization lifecycle (O-020)', () => {
  beforeAll(async () => {
    assertOrganizationsTestDatabase()
    await cleanupOrganizationTestRecords()
  })

  afterEach(async () => {
    await cleanupOrganizationTestRecords()
  })

  afterAll(async () => {
    await cleanupOrganizationTestRecords()
    expect(await countOrganizationTestRecords()).toBe(0)
  })

  it('transitions ACTIVE → SUSPENDED with archivedAt null', async () => {
    const { suspendOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Suspend')
    const suspended = await suspendOrganization(created.id)

    expect(suspended.status).toBe('SUSPENDED')
    expect(suspended.archivedAt).toBeNull()

    const persisted = await reread(created.id)
    expect(persisted.status).toBe('SUSPENDED')
    expect(persisted.archivedAt).toBeNull()
  })

  it('transitions SUSPENDED → ACTIVE with archivedAt null', async () => {
    const { suspendOrganization } = await organizationMutations()
    const { reactivateOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Reactivate')
    await suspendOrganization(created.id)

    const reactivated = await reactivateOrganization(created.id)

    expect(reactivated.status).toBe('ACTIVE')
    expect(reactivated.archivedAt).toBeNull()

    const persisted = await reread(created.id)
    expect(persisted.status).toBe('ACTIVE')
    expect(persisted.archivedAt).toBeNull()
  })

  it('transitions ACTIVE → ARCHIVED with archivedAt set', async () => {
    const { archiveOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Archive')
    const archived = await archiveOrganization(created.id)

    expect(archived.status).toBe('ARCHIVED')
    expect(archived.archivedAt).not.toBeNull()
    expect(archived.archivedAt).toBeInstanceOf(Date)

    const persisted = await reread(created.id)
    expect(persisted.status).toBe('ARCHIVED')
    expect(persisted.archivedAt).not.toBeNull()
    expect(persisted.archivedAt).toBeInstanceOf(Date)
  })

  it('transitions ARCHIVED → ACTIVE with archivedAt null', async () => {
    const { archiveOrganization } = await organizationMutations()
    const { restoreOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Restore')
    await archiveOrganization(created.id)

    const restored = await restoreOrganization(created.id)

    expect(restored.status).toBe('ACTIVE')
    expect(restored.archivedAt).toBeNull()

    const persisted = await reread(created.id)
    expect(persisted.status).toBe('ACTIVE')
    expect(persisted.archivedAt).toBeNull()
  })

  it('rejects suspend from SUSPENDED without partial mutation', async () => {
    const { suspendOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Suspend Susp')
    const suspended = await suspendOrganization(created.id)

    await expectOrganizationError(
      suspendOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'SUSPENDED',
      expectedArchivedAt: null,
    })

    expect(suspended.status).toBe('SUSPENDED')
  })

  it('rejects suspend from ARCHIVED without partial mutation', async () => {
    const { archiveOrganization } = await organizationMutations()
    const { suspendOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Suspend Arch')
    const archived = await archiveOrganization(created.id)

    await expectOrganizationError(
      suspendOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'ARCHIVED',
      expectedArchivedAt: archived.archivedAt,
    })
  })

  it('rejects reactivate from ACTIVE without partial mutation', async () => {
    const { reactivateOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Reactivate Act')

    await expectOrganizationError(
      reactivateOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'ACTIVE',
      expectedArchivedAt: null,
    })
  })

  it('rejects reactivate from ARCHIVED without partial mutation', async () => {
    const { archiveOrganization } = await organizationMutations()
    const { reactivateOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Reactivate Arch')
    const archived = await archiveOrganization(created.id)

    await expectOrganizationError(
      reactivateOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'ARCHIVED',
      expectedArchivedAt: archived.archivedAt,
    })
  })

  it('rejects archive from SUSPENDED without partial mutation', async () => {
    const { suspendOrganization } = await organizationMutations()
    const { archiveOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Archive Susp')
    await suspendOrganization(created.id)

    await expectOrganizationError(
      archiveOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'SUSPENDED',
      expectedArchivedAt: null,
    })
  })

  it('rejects archive from ARCHIVED without partial mutation', async () => {
    const { archiveOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Archive Arch')
    const archived = await archiveOrganization(created.id)

    await expectOrganizationError(
      archiveOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'ARCHIVED',
      expectedArchivedAt: archived.archivedAt,
    })
  })

  it('rejects restore from ACTIVE without partial mutation', async () => {
    const { restoreOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Restore Act')

    await expectOrganizationError(
      restoreOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'ACTIVE',
      expectedArchivedAt: null,
    })
  })

  it('rejects restore from SUSPENDED without partial mutation', async () => {
    const { suspendOrganization } = await organizationMutations()
    const { restoreOrganization } = await organizationMutations()

    const created = await createActiveOrganization('O-020 Invalid Restore Susp')
    await suspendOrganization(created.id)

    await expectOrganizationError(
      restoreOrganization(created.id),
      ORGANIZATION_ERROR_CODES.INVALID_STATE
    )

    await assertUnchangedAfterInvalidTransition({
      organizationId: created.id,
      expectedStatus: 'SUSPENDED',
      expectedArchivedAt: null,
    })
  })
})
