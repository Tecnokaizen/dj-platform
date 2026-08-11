import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

const INVITATION_TOKEN_BYTES = 32

export function generateInvitationToken(): string {
  return randomBytes(INVITATION_TOKEN_BYTES).toString('base64url')
}

export function hashInvitationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex')
}
