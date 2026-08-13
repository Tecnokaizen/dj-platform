import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  ORGANIZATION_ERROR_CODES,
} from '@/core/modules/organizations/errors/organization-error'
import { createOrganizationRecordSchema } from '@/core/modules/organizations/schemas/create-organization-record'
import { normalizeOrganizationSlug } from '@/core/modules/organizations/schemas/normalize-organization-slug'
import { organizationSlugSchema } from '@/core/modules/organizations/schemas/organization-slug'
import { assertOrganizationsTestDatabase } from '@/core/modules/organizations/tests/assert-test-database'
import {
  createOwnedOrganizationTestRecord,
  deleteOrganizationTestRecords,
} from '@/core/modules/organizations/tests/organization-owner-fixture'

const TEST_PREFIX = 'o021-test-'

async function cleanup(): Promise<void> {
  assertOrganizationsTestDatabase()
  const { prisma } = await import('@/lib/prisma')
  await deleteOrganizationTestRecords(prisma, {
    slug: { startsWith: TEST_PREFIX },
  })
}

describe('Organization slug contract (O-021)', () => {
  beforeAll(cleanup)
  afterEach(cleanup)
  afterAll(cleanup)

  it('normalizes a supplied slug to deterministic ASCII URL-safe form', () => {
    expect(normalizeOrganizationSlug('  Café del Mar & Co.  ')).toBe(
      'cafe-del-mar-co'
    )
    expect(organizationSlugSchema.parse('Á---B___C')).toBe('a-b-c')
  })

  it('generates the slug from name when omitted', () => {
    expect(
      createOrganizationRecordSchema.parse({ name: '  Música Para SaaS  ' })
    ).toMatchObject({
      name: 'Música Para SaaS',
      slug: 'musica-para-saas',
    })
  })

  it('rejects normalized slugs outside the 3 to 63 character boundary', () => {
    expect(() => organizationSlugSchema.parse('***')).toThrow()
    expect(() => organizationSlugSchema.parse('ab')).toThrow()
    expect(() => organizationSlugSchema.parse('a'.repeat(64))).toThrow()
  })

  it('persists generated slugs and lets PostgreSQL decide a concurrent conflict', async () => {
    const { prisma } = await import('@/lib/prisma')
    const name = `${TEST_PREFIX}${randomUUID().slice(0, 12)}`
    const expectedSlug = normalizeOrganizationSlug(name)
    const results = await Promise.allSettled([
      createOwnedOrganizationTestRecord(prisma, { name }),
      createOwnedOrganizationTestRecord(prisma, { name }),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1
    )
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1
    )
    expect(results.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: {
        name: 'OrganizationError',
        code: ORGANIZATION_ERROR_CODES.SLUG_CONFLICT,
      },
    })
    await expect(
      prisma.organization.findUnique({ where: { slug: expectedSlug } })
    ).resolves.toMatchObject({ name, slug: expectedSlug })
  })
})
