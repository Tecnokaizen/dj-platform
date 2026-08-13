import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import pg from 'pg'

import {
  assertOrganizationsTestDatabase,
  createOrganizationTestSlug,
} from '@/core/modules/organizations/tests/assert-test-database'
import {
  ORGANIZATION_ERROR_CODES,
  OrganizationError,
} from '@/core/modules/organizations/errors/organization-error'
import {
  createOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'

const TEST_PREFIX = 'o022-test-'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

async function countById(id: string): Promise<number> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')

  return prisma.organization.count({
    where: {
      id,
    },
  })
}

async function countBySlug(slug: string): Promise<number> {
  assertOrganizationsTestDatabase()

  const { prisma } = await import('@/lib/prisma')

  return prisma.organization.count({
    where: {
      slug,
    },
  })
}

describe('Organization persistence integrity (O-022)', () => {
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

  it('generates a Prisma UUID id that is persisted', async () => {
    const { findOrganizationById } = await import(
      '@/core/modules/organizations/services/find-organization-by-id'
    )

    const created = await createOrganizationTestRecord({
      name: 'O-022 UUID',
      slug: createOrganizationTestSlug(TEST_PREFIX),
    })

    expect(created.id).toMatch(UUID_PATTERN)

    const persisted = await findOrganizationById(created.id)
    expect(persisted).not.toBeNull()
    expect(persisted?.id).toBe(created.id)
  })

  it('applies Prisma defaults for status, locale, timezone and archivedAt', async () => {
    const { findOrganizationById } = await import(
      '@/core/modules/organizations/services/find-organization-by-id'
    )

    const created = await createOrganizationTestRecord({
      name: 'O-022 Defaults',
      slug: createOrganizationTestSlug(TEST_PREFIX),
    })

    expect(created.status).toBe('ACTIVE')
    expect(created.locale).toBe('es')
    expect(created.timezone).toBe('UTC')
    expect(created.archivedAt).toBeNull()

    const persisted = await findOrganizationById(created.id)
    expect(persisted).not.toBeNull()
    expect(persisted?.status).toBe('ACTIVE')
    expect(persisted?.locale).toBe('es')
    expect(persisted?.timezone).toBe('UTC')
    expect(persisted?.archivedAt).toBeNull()
  })

  it('rejects PostgreSQL INSERT omitting name (NOT NULL)', async () => {
    assertOrganizationsTestDatabase()

    const id = crypto.randomUUID()
    const slug = createOrganizationTestSlug(TEST_PREFIX)
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    try {
      await expect(
        client.query(
          `INSERT INTO organizations (
            id, slug, status, locale, timezone, created_at, updated_at
          ) VALUES (
            $1::uuid, $2, 'ACTIVE', 'es', 'UTC', NOW(), NOW()
          )`,
          [id, slug]
        )
      ).rejects.toBeTruthy()
    } finally {
      await client.end()
    }

    expect(await countById(id)).toBe(0)
    expect(await countBySlug(slug)).toBe(0)
  })

  it('rejects PostgreSQL INSERT omitting slug (NOT NULL)', async () => {
    assertOrganizationsTestDatabase()

    const id = crypto.randomUUID()
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    try {
      await expect(
        client.query(
          `INSERT INTO organizations (
            id, name, status, locale, timezone, created_at, updated_at
          ) VALUES (
            $1::uuid, $2, 'ACTIVE', 'es', 'UTC', NOW(), NOW()
          )`,
          [id, 'O-022 Required Slug']
        )
      ).rejects.toBeTruthy()
    } finally {
      await client.end()
    }

    expect(await countById(id)).toBe(0)
  })

  it('keeps createdAt stable and advances updatedAt on Prisma update', async () => {
    const { createUpdateOrganization } = await import(
      '@/core/modules/organizations/services/update-organization'
    )
    const { prisma } = await import('@/lib/prisma')
    const updateOrganization = createUpdateOrganization(prisma)
    const { findOrganizationById } = await import(
      '@/core/modules/organizations/services/find-organization-by-id'
    )

    const created = await createOrganizationTestRecord({
      name: 'O-022 Timestamps',
      slug: createOrganizationTestSlug(TEST_PREFIX),
    })

    expect(created.createdAt).toBeInstanceOf(Date)
    expect(created.updatedAt).toBeInstanceOf(Date)

    const initialCreatedAt = created.createdAt.getTime()
    const initialUpdatedAt = created.updatedAt.getTime()

    await new Promise((resolve) => setTimeout(resolve, 5))

    await updateOrganization(created.id, {
      name: 'O-022 Timestamps Updated',
    })

    const persisted = await findOrganizationById(created.id)
    expect(persisted).not.toBeNull()
    expect(persisted?.createdAt.getTime()).toBe(initialCreatedAt)
    expect(persisted?.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt)
  })

  it('rejects duplicate slug via UNIQUE constraint mapped to SLUG_CONFLICT', async () => {

    const slug = createOrganizationTestSlug(TEST_PREFIX)

    await createOrganizationTestRecord({
      name: 'O-022 Unique Owner',
      slug,
    })

    try {
      await createOrganizationTestRecord({
        name: 'O-022 Unique Duplicate',
        slug,
      })
      expect.unreachable('Expected OrganizationError to be thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(OrganizationError)
      expect((error as OrganizationError).code).toBe(
        ORGANIZATION_ERROR_CODES.SLUG_CONFLICT
      )
    }

    expect(await countBySlug(slug)).toBe(1)
  })
})
