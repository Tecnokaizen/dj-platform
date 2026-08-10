import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const ROLES_ROOT = path.resolve(process.cwd(), 'src/core/modules/roles')
const SCHEMA_PATH = path.resolve(process.cwd(), 'prisma/schema.prisma')
const THIS_TEST_FILE = path.resolve(
  process.cwd(),
  'src/core/modules/roles/tests/role-boundary.test.ts'
)

const PRODUCTION_DIRS = [
  'constants',
  'errors',
  'schemas',
  'seed',
  'services',
  'types',
] as const

function forbiddenTokens(): string[] {
  return [
    ['Organization', 'Membership'].join(''),
    ['Role', 'Permission'].join(''),
    ['organization', 'Id'].join(''),
    ['@/core/modules/', 'memberships'].join(''),
    ['@/core/modules/', 'permissions'].join(''),
    'Permission',
  ]
}

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(absolutePath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(absolutePath)
    }
  }

  return files
}

function extractRoleModelBlock(schema: string): string {
  const match = schema.match(/model Role \{[\s\S]*?\n\}/)

  if (!match) {
    throw new Error('Role model block not found in prisma/schema.prisma')
  }

  return match[0]
}

function assertNoForbiddenTokens(contents: string, relativePath: string): void {
  for (const token of forbiddenTokens()) {
    expect(contents, `${relativePath} contains forbidden token ${token}`).not.toContain(
      token
    )
  }
}

describe('Roles Foundation boundary (R-030)', () => {
  it('Roles production sources do not introduce Memberships/Permissions boundaries', async () => {
    const files: string[] = []

    for (const directory of PRODUCTION_DIRS) {
      files.push(...(await listTypeScriptFiles(path.join(ROLES_ROOT, directory))))
    }

    expect(files.length).toBeGreaterThan(0)

    for (const filePath of files) {
      const contents = await readFile(filePath, 'utf8')
      const relativePath = path.relative(process.cwd(), filePath)
      assertNoForbiddenTokens(contents, relativePath)
    }
  })

  it('Role Prisma model does not require organizationId or Membership relations', async () => {
    const schema = await readFile(SCHEMA_PATH, 'utf8')
    const roleModel = extractRoleModelBlock(schema)

    for (const token of forbiddenTokens()) {
      expect(roleModel).not.toContain(token)
    }
  })

  it('Roles tests remain independently runnable without Memberships/Permissions modules', async () => {
    const testFiles = (
      await listTypeScriptFiles(path.join(ROLES_ROOT, 'tests'))
    ).filter(
      (filePath) =>
        filePath.endsWith('.test.ts') && filePath !== THIS_TEST_FILE
    )

    expect(testFiles.length).toBeGreaterThan(0)

    const dependencyTokens = [
      ['@/core/modules/', 'memberships'].join(''),
      ['@/core/modules/', 'permissions'].join(''),
      ['Organization', 'Membership'].join(''),
      ['Role', 'Permission'].join(''),
    ]

    for (const filePath of testFiles) {
      const contents = await readFile(filePath, 'utf8')
      const relativePath = path.relative(process.cwd(), filePath)

      for (const token of dependencyTokens) {
        expect(
          contents,
          `${relativePath} contains forbidden dependency ${token}`
        ).not.toContain(token)
      }
    }
  })
})
