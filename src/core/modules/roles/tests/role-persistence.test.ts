import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Prisma } from '@/generated/prisma/client'

import {
  assertRolesTestDatabase,
  createRoleTestKey,
} from '@/core/modules/roles/tests/assert-test-database'

const TEST_PREFIX = 'r023-test-'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

describe('Role persistence (R-023)', () => {
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

  it('generates a UUID primary key', async () => {
    const { prisma } = await import('@/lib/prisma')

    const role = await prisma.role.create({
      data: {
        key: createRoleTestKey(TEST_PREFIX),
        name: 'R-023 UUID Role',
      },
    })

    expect(role.id).toMatch(UUID_PATTERN)
  })

  it('persists required fields key and name', async () => {
    const { prisma } = await import('@/lib/prisma')

    const key = createRoleTestKey(TEST_PREFIX)
    const role = await prisma.role.create({
      data: {
        key,
        name: 'R-023 Required Fields',
      },
    })

    expect(role.key).toBe(key)
    expect(role.name).toBe('R-023 Required Fields')
  })

  it('applies field defaults for isSystem, sortOrder and description', async () => {
    const { prisma } = await import('@/lib/prisma')

    const role = await prisma.role.create({
      data: {
        key: createRoleTestKey(TEST_PREFIX),
        name: 'R-023 Defaults',
      },
    })

    expect(role.isSystem).toBe(true)
    expect(role.sortOrder).toBe(0)
    expect(role.description).toBeNull()
  })

  it('sets createdAt and updatedAt timestamps', async () => {
    const { prisma } = await import('@/lib/prisma')

    const before = new Date()

    const role = await prisma.role.create({
      data: {
        key: createRoleTestKey(TEST_PREFIX),
        name: 'R-023 Timestamps',
      },
    })

    const after = new Date()

    expect(role.createdAt).toBeInstanceOf(Date)
    expect(role.updatedAt).toBeInstanceOf(Date)
    expect(role.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    expect(role.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000)
    expect(role.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    expect(role.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000)
  })

  it('enforces unique Role key', async () => {
    const { prisma } = await import('@/lib/prisma')

    const key = createRoleTestKey(TEST_PREFIX)

    await prisma.role.create({
      data: {
        key,
        name: 'R-023 Unique First',
      },
    })

    try {
      await prisma.role.create({
        data: {
          key,
          name: 'R-023 Unique Duplicate',
        },
      })
      expect.unreachable('Expected unique key constraint to reject duplicate')
    } catch (error) {
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError)
      expect((error as Prisma.PrismaClientKnownRequestError).code).toBe('P2002')
    }
  })
})
