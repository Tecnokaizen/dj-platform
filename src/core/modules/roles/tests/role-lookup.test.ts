import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  assertRolesTestDatabase,
  createRoleTestKey,
} from '@/core/modules/roles/tests/assert-test-database'

const TEST_PREFIX = 'r024-test-'

async function cleanupRoleTestRecords(): Promise<void> {
  assertRolesTestDatabase()

  const { prisma } = await import('@/lib/prisma')

  await prisma.role.deleteMany({
    where: {
      key: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

async function countRoleTestRecords(): Promise<number> {
  assertRolesTestDatabase()

  const { prisma } = await import('@/lib/prisma')

  return prisma.role.count({
    where: {
      key: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

describe('Role lookup (R-024)', () => {
  beforeAll(async () => {
    assertRolesTestDatabase()
    await cleanupRoleTestRecords()
  })

  afterEach(async () => {
    await cleanupRoleTestRecords()
  })

  afterAll(async () => {
    await cleanupRoleTestRecords()
    expect(await countRoleTestRecords()).toBe(0)
  })

  it('finds a Role by ID', async () => {
    const { prisma } = await import('@/lib/prisma')
    const { findRoleById } = await import(
      '@/core/modules/roles/services/find-role-by-id'
    )

    const key = createRoleTestKey(TEST_PREFIX)
    const created = await prisma.role.create({
      data: {
        key,
        name: 'R-024 Find By Id',
      },
    })

    const found = await findRoleById(created.id)

    expect(found).not.toBeNull()
    expect(found?.id).toBe(created.id)
    expect(found?.key).toBe(key)
  })

  it('finds a Role by key', async () => {
    const { prisma } = await import('@/lib/prisma')
    const { findRoleByKey } = await import(
      '@/core/modules/roles/services/find-role-by-key'
    )

    const key = createRoleTestKey(TEST_PREFIX)
    const created = await prisma.role.create({
      data: {
        key,
        name: 'R-024 Find By Key',
      },
    })

    const found = await findRoleByKey(key)

    expect(found).not.toBeNull()
    expect(found?.id).toBe(created.id)
    expect(found?.key).toBe(key)
  })

  it('returns null for a missing ID', async () => {
    const { findRoleById } = await import(
      '@/core/modules/roles/services/find-role-by-id'
    )

    const missing = await findRoleById(crypto.randomUUID())

    expect(missing).toBeNull()
  })

  it('returns null for a missing key', async () => {
    const { findRoleByKey } = await import(
      '@/core/modules/roles/services/find-role-by-key'
    )

    const missing = await findRoleByKey(
      `${TEST_PREFIX}missing-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
    )

    expect(missing).toBeNull()
  })
})
