import { describe, expect, it } from 'vitest'

import {
  compareCamelot,
  effectiveCamelotKey,
  parseCamelotKey,
} from '@/domains/dj-studio/session-builder/musical-rules'

describe('parseCamelotKey', () => {
  it.each([
    ['8A', '8A'],
    ['8a', '8A'],
    [' 8A ', '8A'],
    ['1A', '1A'],
    ['12B', '12B'],
    ['12b', '12B'],
  ] as const)('parses %j → %j', (input, expected) => {
    expect(parseCamelotKey(input)).toBe(expected)
  })

  it.each([
    '0A',
    '13A',
    '1C',
    'AA',
    '',
    '  ',
    '8',
    'A8',
    '8AB',
  ] as const)('rejects invalid %j', (input) => {
    expect(parseCamelotKey(input)).toBeNull()
  })

  it('rejects null and undefined', () => {
    expect(parseCamelotKey(null)).toBeNull()
    expect(parseCamelotKey(undefined)).toBeNull()
  })
})

describe('effectiveCamelotKey', () => {
  it('prefers parseable customKey over track camelotKey', () => {
    expect(
      effectiveCamelotKey({
        customKey: '9a',
        camelotKey: '8A',
      })
    ).toBe('9A')
  })

  it('falls back to track camelotKey when customKey is null', () => {
    expect(
      effectiveCamelotKey({
        customKey: null,
        camelotKey: '8a',
      })
    ).toBe('8A')
  })

  it('skips unparseable customKey and uses camelotKey', () => {
    expect(
      effectiveCamelotKey({
        customKey: 'C#m',
        camelotKey: '8A',
      })
    ).toBe('8A')
  })

  it('returns null when neither Camelot value parses (no musicalKey conversion)', () => {
    expect(
      effectiveCamelotKey({
        customKey: 'F minor',
        camelotKey: null,
      })
    ).toBeNull()
  })
})

describe('compareCamelot', () => {
  it('classifies exact matches', () => {
    expect(compareCamelot('8A', '8A')).toBe('exact')
    expect(compareCamelot('8a', '8A')).toBe('exact')
  })

  it('classifies adjacent same-letter neighbors including wrap', () => {
    expect(compareCamelot('8A', '7A')).toBe('adjacent')
    expect(compareCamelot('8A', '9A')).toBe('adjacent')
    expect(compareCamelot('1A', '12A')).toBe('adjacent')
    expect(compareCamelot('12B', '1B')).toBe('adjacent')
  })

  it('classifies relative A/B same number', () => {
    expect(compareCamelot('8A', '8B')).toBe('relative')
    expect(compareCamelot('8B', '8A')).toBe('relative')
  })

  it('classifies incompatible pairs', () => {
    expect(compareCamelot('8A', '10A')).toBe('incompatible')
    expect(compareCamelot('8A', '7B')).toBe('incompatible')
  })

  it('returns unknown when either side cannot be parsed', () => {
    expect(compareCamelot(null, '8A')).toBe('unknown')
    expect(compareCamelot('8A', null)).toBe('unknown')
    expect(compareCamelot('foo', 'bar')).toBe('unknown')
    expect(compareCamelot(undefined, undefined)).toBe('unknown')
  })
})
