import { describe, expect, it } from 'vitest'

import {
  getOrganizationPublicErrorMessage,
  getOrganizationPublicMessage,
  ORGANIZATION_PUBLIC_NOTICE_CODES,
} from '@/core/modules/organizations/errors/organization-public-notice'

describe('Organization public notices', () => {
  it('maps only trusted allowlisted codes', () => {
    expect(
      getOrganizationPublicMessage(ORGANIZATION_PUBLIC_NOTICE_CODES.UPDATED)
    ).toBeTruthy()
    expect(
      getOrganizationPublicErrorMessage(
        ORGANIZATION_PUBLIC_NOTICE_CODES.SLUG_CONFLICT
      )
    ).toBeTruthy()
  })

  it('ignores arbitrary URL-controlled values', () => {
    expect(getOrganizationPublicMessage('<script>alert(1)</script>')).toBeNull()
    expect(getOrganizationPublicErrorMessage('internal db error')).toBeNull()
  })
})
