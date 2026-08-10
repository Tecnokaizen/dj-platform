import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { SYSTEM_ROLE_KEYS } from '@/core/modules/roles/constants/system-role-keys'
import { SYSTEM_ROLE_METADATA } from '@/core/modules/roles/constants/system-role-metadata'

const ROLES_ROOT = path.resolve(process.cwd(), 'src/core/modules/roles')

const UUID_LITERAL_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i

const FORBIDDEN_ROLE_UUID_CONSTANT_PATTERN =
  /OWNER_ROLE_ID|ADMIN_ROLE_ID|ROLE_UUID|HARD_?CODED_ROLE_UUID/i

async function listProductionSourceFiles(
  directory: string
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'tests') {
        continue
      }

      files.push(...(await listProductionSourceFiles(absolutePath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(absolutePath)
    }
  }

  return files
}

describe('Hard-coded Role UUID audit (R-029)', () => {
  it('production Roles sources do not embed Role UUID literals or UUID constants', async () => {
    const files = await listProductionSourceFiles(ROLES_ROOT)

    expect(files.length).toBeGreaterThan(0)

    for (const filePath of files) {
      const contents = await readFile(filePath, 'utf8')
      const relativePath = path.relative(process.cwd(), filePath)

      expect(contents, relativePath).not.toMatch(UUID_LITERAL_PATTERN)
      expect(contents, relativePath).not.toMatch(
        FORBIDDEN_ROLE_UUID_CONSTANT_PATTERN
      )
    }
  })

  it('canonical catalog constants resolve by key, not by UUID', () => {
    for (const key of Object.values(SYSTEM_ROLE_KEYS)) {
      expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/)
      expect(key).not.toMatch(UUID_LITERAL_PATTERN)
    }

    for (const role of SYSTEM_ROLE_METADATA) {
      expect(role.key).toMatch(/^[A-Z][A-Z0-9_]*$/)
      expect(role.key).not.toMatch(UUID_LITERAL_PATTERN)
      expect(role).not.toHaveProperty('id')
    }
  })

  it('canonical resolution services look up Roles by key', async () => {
    const findRoleByKeySource = await readFile(
      path.join(ROLES_ROOT, 'services/find-role-by-key.ts'),
      'utf8'
    )
    const getRoleByKeySource = await readFile(
      path.join(ROLES_ROOT, 'services/get-role-by-key.ts'),
      'utf8'
    )
    const resolveRequiredRoleSource = await readFile(
      path.join(ROLES_ROOT, 'services/resolve-required-role.ts'),
      'utf8'
    )
    const seedSource = await readFile(
      path.join(ROLES_ROOT, 'seed/seed-system-roles.ts'),
      'utf8'
    )

    expect(findRoleByKeySource).toContain('where: { key }')
    expect(getRoleByKeySource).toContain('findRoleByKey')
    expect(resolveRequiredRoleSource).toContain('findRoleByKey')
    expect(seedSource).toContain('where: {\n        key: role.key,')
    expect(seedSource).not.toMatch(/\bid\s*:/)
  })
})
