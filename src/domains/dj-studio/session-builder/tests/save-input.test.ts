import { describe, expect, it } from 'vitest'

import {
  parseSessionBuilderSaveInput,
} from '@/domains/dj-studio/session-builder/services/save-session-builder-playlist-input'
import { DJ_STUDIO_ERROR_CODES } from '@/domains/dj-studio/shared/errors'

const ID_A = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001'
const ID_B = 'bbbbbbbb-bbbb-4bbb-8bbb-000000000002'

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Propuesta de sesión',
    prompt: 'sunset afro house',
    tracks: [
      { libraryItemId: ID_A, transitionNote: null },
      { libraryItemId: ID_B, transitionNote: 'Transición' },
    ],
    ...overrides,
  }
}

function expectReject(input: unknown) {
  try {
    parseSessionBuilderSaveInput(input)
    expect.unreachable('expected VALIDATION_ERROR')
  } catch (error) {
    expect(error).toMatchObject({ code: DJ_STUDIO_ERROR_CODES.VALIDATION_ERROR })
  }
}

describe('parseSessionBuilderSaveInput', () => {
  it('accepts a valid save payload', () => {
    const parsed = parseSessionBuilderSaveInput(validInput())
    expect(parsed.tracks).toHaveLength(2)
    expect(parsed.name).toBe('Propuesta de sesión')
  })

  it('rejects invalid name / prompt / tracks', () => {
    expectReject(validInput({ name: '   ' }))
    expectReject(validInput({ name: 'x'.repeat(256) }))
    expectReject(validInput({ prompt: '' }))
    expectReject(validInput({ prompt: 'y'.repeat(4001) }))
    expectReject(validInput({ tracks: [] }))
    expectReject(
      validInput({
        tracks: Array.from({ length: 61 }, (_, index) => ({
          libraryItemId: `cccccccc-cccc-4ccc-8ccc-${String(index).padStart(12, '0')}`,
          transitionNote: null,
        })),
      }),
    )
  })

  it('rejects invalid UUID, duplicates, oversized notes, unknown fields', () => {
    expectReject(
      validInput({
        tracks: [{ libraryItemId: 'not-a-uuid', transitionNote: null }],
      }),
    )
    expectReject(
      validInput({
        tracks: [
          { libraryItemId: ID_A, transitionNote: null },
          { libraryItemId: ID_A, transitionNote: null },
        ],
      }),
    )
    expectReject(
      validInput({
        tracks: [
          { libraryItemId: ID_A, transitionNote: 'z'.repeat(501) },
        ],
      }),
    )
    expectReject(validInput({ organizationId: ID_A }))
  })
})
