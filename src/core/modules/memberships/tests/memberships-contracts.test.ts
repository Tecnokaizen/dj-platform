import { describe, expect, it } from 'vitest'

import {
  INVITATION_ERROR_CODES,
  InvitationError,
} from '@/core/modules/memberships/errors/invitation-error'
import {
  MEMBERSHIP_ERROR_CODES,
  MembershipError,
} from '@/core/modules/memberships/errors/membership-error'
import { acceptInvitationSchema } from '@/core/modules/memberships/schemas/accept-invitation'
import { changeMembershipRoleSchema } from '@/core/modules/memberships/schemas/change-membership-role'
import { createInvitationSchema } from '@/core/modules/memberships/schemas/create-invitation'
import { invitationIdSchema } from '@/core/modules/memberships/schemas/invitation-id'
import { membershipIdSchema } from '@/core/modules/memberships/schemas/membership-id'
import { organizationProfileMembershipSchema } from '@/core/modules/memberships/schemas/organization-profile-membership'
import { restoreRemovedMembershipSchema } from '@/core/modules/memberships/schemas/restore-removed-membership'
import { normalizeEmail } from '@/core/modules/memberships/utils/normalize-email'

const UUID_A = '123e4567-e89b-42d3-a456-426614174000'
const UUID_B = '123e4567-e89b-42d3-a456-426614174001'
const UUID_C = '123e4567-e89b-42d3-a456-426614174002'

describe('Memberships Phase 4 contracts', () => {
  it('accepts valid UUID inputs and rejects invalid UUIDs', () => {
    expect(membershipIdSchema.safeParse(UUID_A).success).toBe(true)
    expect(invitationIdSchema.safeParse(UUID_A).success).toBe(true)
    expect(membershipIdSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(invitationIdSchema.safeParse('not-a-uuid').success).toBe(false)

    expect(
      organizationProfileMembershipSchema.safeParse({
        organizationId: UUID_A,
        profileId: UUID_B,
      }).success,
    ).toBe(true)
    expect(
      changeMembershipRoleSchema.safeParse({
        membershipId: UUID_A,
        roleId: UUID_C,
      }).success,
    ).toBe(true)
    expect(
      restoreRemovedMembershipSchema.safeParse({
        membershipId: UUID_A,
        targetRoleId: UUID_C,
      }).success,
    ).toBe(true)
  })

  it('validates and trims invitation email without accepting actor identity', () => {
    const parsed = createInvitationSchema.parse({
      organizationId: UUID_A,
      recipientEmail: '  Person@Example.com  ',
      roleId: UUID_C,
      actorProfileId: UUID_B,
      invitedByMembershipId: UUID_B,
    })

    expect(parsed).toEqual({
      organizationId: UUID_A,
      recipientEmail: 'Person@Example.com',
      roleId: UUID_C,
    })
    expect(
      createInvitationSchema.safeParse({
        organizationId: UUID_A,
        recipientEmail: 'invalid-email',
        roleId: UUID_C,
      }).success,
    ).toBe(false)

    const emailAtLimit = `${'a'.repeat(308)}@example.com`
    const emailOverLimit = `${'a'.repeat(309)}@example.com`

    expect(emailAtLimit).toHaveLength(320)
    expect(
      createInvitationSchema.safeParse({
        organizationId: UUID_A,
        recipientEmail: emailAtLimit,
        roleId: UUID_C,
      }).success,
    ).toBe(true)
    expect(
      createInvitationSchema.safeParse({
        organizationId: UUID_A,
        recipientEmail: emailOverLimit,
        roleId: UUID_C,
      }).success,
    ).toBe(false)
  })

  it('accepts only exact 43-character base64url invitation tokens', () => {
    expect(
      acceptInvitationSchema.safeParse({ token: `${'A'.repeat(42)}_` }).success,
    ).toBe(true)

    for (const token of [
      'A'.repeat(42),
      'A'.repeat(44),
      `${'A'.repeat(42)}+`,
      `${'A'.repeat(42)}/`,
      `${'A'.repeat(42)}=`,
    ]) {
      expect(acceptInvitationSchema.safeParse({ token }).success).toBe(false)
    }
  })

  it('normalizes email canonically and idempotently', () => {
    const normalized = normalizeEmail('  Person@Example.COM  ')

    expect(normalized).toBe('person@example.com')
    expect(normalizeEmail(normalized)).toBe(normalized)
  })

  it('exposes stable Membership error codes and class metadata', () => {
    expect(Object.values(MEMBERSHIP_ERROR_CODES)).toEqual([
      'MEMBERSHIP_NOT_FOUND',
      'MEMBERSHIP_ALREADY_EXISTS',
      'MEMBERSHIP_NOT_ACTIVE',
      'MEMBERSHIP_SUSPENDED',
      'MEMBERSHIP_REMOVED',
      'INVALID_MEMBERSHIP_STATE',
      'ROLE_REQUIRED',
      'ROLE_INVALID',
      'OWNER_TRANSFER_REQUIRED',
      'OWNER_INVARIANT_VIOLATION',
    ])

    const error = new MembershipError(MEMBERSHIP_ERROR_CODES.NOT_FOUND)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('MembershipError')
    expect(error.code).toBe('MEMBERSHIP_NOT_FOUND')
    expect(error.message).toBe('MEMBERSHIP_NOT_FOUND')
  })

  it('exposes stable Invitation error codes without persistence details', () => {
    expect(Object.values(INVITATION_ERROR_CODES)).toEqual([
      'INVITATION_NOT_FOUND',
      'INVITATION_ALREADY_PENDING',
      'INVITATION_NOT_PENDING',
      'INVITATION_EXPIRED',
      'INVITATION_REVOKED',
      'INVITATION_ALREADY_ACCEPTED',
      'INVITATION_RECIPIENT_MISMATCH',
      'INVITATION_TOKEN_INVALID',
      'ALREADY_MEMBER',
    ])

    const error = new InvitationError(INVITATION_ERROR_CODES.TOKEN_INVALID)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('InvitationError')
    expect(error.code).toBe('INVITATION_TOKEN_INVALID')
    expect(error.message).toBe('INVITATION_TOKEN_INVALID')
    expect(JSON.stringify(INVITATION_ERROR_CODES)).not.toMatch(
      /tokenHash|Prisma|database|constraint/i,
    )
  })
})
