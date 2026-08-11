import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  generateInvitationToken,
  hashInvitationToken,
} from '@/core/modules/memberships/security/invitation-token'

const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

describe('Invitation token security foundation (M-039 → M-041)', () => {
  it('generates unpredictable 32-byte base64url transport tokens', () => {
    const tokens = Array.from({ length: 64 }, generateInvitationToken)

    expect(new Set(tokens)).toHaveLength(tokens.length)

    for (const token of tokens) {
      expect(token).toMatch(INVITATION_TOKEN_PATTERN)
      expect(Buffer.from(token, 'base64url')).toHaveLength(32)
    }
  })

  it('hashes raw tokens as deterministic SHA-256 lowercase hexadecimal', () => {
    const rawToken = 'test-token'
    const expectedHash =
      '4c5dc9b7708905f77f5e5d16316b5dfb425e68cb326dcd55a860e90a7707031e'

    expect(hashInvitationToken(rawToken)).toBe(expectedHash)
    expect(hashInvitationToken(rawToken)).toBe(hashInvitationToken(rawToken))
    expect(hashInvitationToken(`${rawToken}-different`)).not.toBe(expectedHash)
    expect(expectedHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('persists only token hashes and excludes secrets from normal DTOs', () => {
    const prismaSchema = readSource('../../../../../prisma/schema.prisma')
    const invitationModel = prismaSchema.match(
      /model OrganizationInvitation \{[\s\S]*?\n\}/
    )?.[0]
    const invitationDto = readSource('../types/invitation-dto.ts')
    const invitationRepository = readSource(
      '../repositories/invitation-repository.ts'
    )
    const tokenHelper = readSource('../security/invitation-token.ts')

    expect(invitationModel).toBeDefined()
    expect(invitationModel).toMatch(/\btokenHash\b/)
    expect(invitationModel).not.toMatch(/\b(?:rawToken|token)\s+\w+/)
    expect(invitationDto).not.toMatch(/\b(?:rawToken|tokenHash)\b/)
    expect(invitationRepository).not.toMatch(/tokenHash:\s*true/)
    expect(tokenHelper).not.toMatch(/\b(?:console|logger|analytics|audit)\b/)
  })
})
