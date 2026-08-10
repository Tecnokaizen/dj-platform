import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  assertOrganizationsTestDatabase,
  createOrganizationTestSlug,
  getOrganizationTestSlugPrefix,
} from '@/core/modules/organizations/tests/assert-test-database'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import type { Organization } from '@/core/modules/organizations/types/organization'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  await prisma.organization.deleteMany({
    where: {
      slug: {
        startsWith: getOrganizationTestSlugPrefix(),
      },
    },
  })
}

async function countOrganizationTestRecords(): Promise<number> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')

  return prisma.organization.count({
    where: {
      slug: {
        startsWith: getOrganizationTestSlugPrefix(),
      },
    },
  })
}

describe('Organization persistence (O-019)', () => {
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

  it('creates an Organization with Prisma defaults', async () => {
    const { createOrganizationRecord } = await import(
      '@/core/modules/organizations/services/create-organization-record'
    )

    const slug = createOrganizationTestSlug()
    const organization = await createOrganizationRecord({
      name: 'O-019 Create Org',
      slug,
    })

    expect(organization.id).toMatch(UUID_PATTERN)
    expect(organization.slug).toBe(slug)
    expect(organization.status).toBe('ACTIVE')
    expect(organization.locale).toBe('es')
    expect(organization.timezone).toBe('UTC')
    expect(organization.archivedAt).toBeNull()
  })

  it('finds an Organization by id and returns null on miss', async () => {
    const { createOrganizationRecord } = await import(
      '@/core/modules/organizations/services/create-organization-record'
    )
    const { findOrganizationById } = await import(
      '@/core/modules/organizations/services/find-organization-by-id'
    )

    const created = await createOrganizationRecord({
      name: 'O-019 Find By Id',
      slug: createOrganizationTestSlug(),
    })

    const found = await findOrganizationById(created.id)
    expect(found).not.toBeNull()
    expect(found?.id).toBe(created.id)

    const missing = await findOrganizationById(crypto.randomUUID())
    expect(missing).toBeNull()
  })

  it('finds an Organization by slug and returns null on miss', async () => {
    const { createOrganizationRecord } = await import(
      '@/core/modules/organizations/services/create-organization-record'
    )
    const { findOrganizationBySlug } = await import(
      '@/core/modules/organizations/services/find-organization-by-slug'
    )

    const slug = createOrganizationTestSlug()
    const created = await createOrganizationRecord({
      name: 'O-019 Find By Slug',
      slug,
    })

    const found = await findOrganizationBySlug(slug)
    expect(found).not.toBeNull()
    expect(found?.id).toBe(created.id)

    const missing = await findOrganizationBySlug(
      `${getOrganizationTestSlugPrefix()}missing-${crypto.randomUUID()}`
    )
    expect(missing).toBeNull()
  })

  it('updates owned fields and clears logoUrl with null', async () => {
    const { createOrganizationRecord } = await import(
      '@/core/modules/organizations/services/create-organization-record'
    )
    const { updateOrganization } = await import(
      '@/core/modules/organizations/services/update-organization'
    )

    const created = await createOrganizationRecord({
      name: 'O-019 Update Org',
      slug: createOrganizationTestSlug(),
      logoUrl: 'https://example.com/logo.png',
    })

    const updated: Organization = await updateOrganization(created.id, {
      name: 'O-019 Updated Name',
      locale: 'en',
      timezone: 'Europe/Madrid',
      logoUrl: null,
    })

    expect(updated.name).toBe('O-019 Updated Name')
    expect(updated.locale).toBe('en')
    expect(updated.timezone).toBe('Europe/Madrid')
    expect(updated.logoUrl).toBeNull()
  })

  it('rejects empty update with UPDATE_EMPTY', async () => {
    const { createOrganizationRecord } = await import(
      '@/core/modules/organizations/services/create-organization-record'
    )
    const { updateOrganization } = await import(
      '@/core/modules/organizations/services/update-organization'
    )

    const created = await createOrganizationRecord({
      name: 'O-019 Empty Update',
      slug: createOrganizationTestSlug(),
    })

    await expectOrganizationError(
      updateOrganization(created.id, {}),
      ORGANIZATION_ERROR_CODES.UPDATE_EMPTY
    )
  })

  it('rejects update for missing id with NOT_FOUND', async () => {
    const { updateOrganization } = await import(
      '@/core/modules/organizations/services/update-organization'
    )

    await expectOrganizationError(
      updateOrganization(crypto.randomUUID(), { name: 'Missing' }),
      ORGANIZATION_ERROR_CODES.NOT_FOUND
    )
  })

  it('rejects duplicate create slug with SLUG_CONFLICT', async () => {
    const { createOrganizationRecord } = await import(
      '@/core/modules/organizations/services/create-organization-record'
    )

    const slug = createOrganizationTestSlug()

    await createOrganizationRecord({
      name: 'O-019 Slug Owner',
      slug,
    })

    await expectOrganizationError(
      createOrganizationRecord({
        name: 'O-019 Slug Duplicate',
        slug,
      }),
      ORGANIZATION_ERROR_CODES.SLUG_CONFLICT
    )
  })

  it('rejects update to an occupied slug with SLUG_CONFLICT', async () => {
    const { createOrganizationRecord } = await import(
      '@/core/modules/organizations/services/create-organization-record'
    )
    const { updateOrganization } = await import(
      '@/core/modules/organizations/services/update-organization'
    )

    const occupiedSlug = createOrganizationTestSlug()
    const otherSlug = createOrganizationTestSlug()

    await createOrganizationRecord({
      name: 'O-019 Occupied Slug',
      slug: occupiedSlug,
    })

    const other = await createOrganizationRecord({
      name: 'O-019 Other Org',
      slug: otherSlug,
    })

    await expectOrganizationError(
      updateOrganization(other.id, { slug: occupiedSlug }),
      ORGANIZATION_ERROR_CODES.SLUG_CONFLICT
    )
  })
})
