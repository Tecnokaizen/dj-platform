export type CamelotLetter = 'A' | 'B'

export type CamelotKey = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}${CamelotLetter}`

export type CamelotCompatibility =
  | 'exact'
  | 'adjacent'
  | 'relative'
  | 'incompatible'
  | 'unknown'

const CAMELOT_PATTERN = /^(1[0-2]|[1-9])([ABab])$/

type ParsedCamelot = {
  number: number
  letter: CamelotLetter
  key: CamelotKey
}

/**
 * Strict Camelot parser for MVP (1A–12A / 1B–12B).
 * Case-insensitive; trims whitespace. Invalid metadata → null (no throw).
 */
export function parseCamelotKey(
  value: string | null | undefined
): CamelotKey | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  const match = CAMELOT_PATTERN.exec(trimmed)
  if (!match) {
    return null
  }

  const number = Number(match[1])
  const letter = match[2].toUpperCase() as CamelotLetter
  return `${number}${letter}` as CamelotKey
}

function parseCamelotParts(
  value: string | null | undefined
): ParsedCamelot | null {
  const key = parseCamelotKey(value)
  if (!key) {
    return null
  }

  const number = Number(key.slice(0, -1))
  const letter = key.slice(-1) as CamelotLetter
  return { number, letter, key }
}

/**
 * Camelot for musical rules.
 * Precedence: parseable customKey → parseable Track.camelotKey → null.
 * P1 does not convert Track.musicalKey (e.g. "C#m") into Camelot.
 */
export function effectiveCamelotKey(input: {
  customKey: string | null
  camelotKey: string | null
}): CamelotKey | null {
  return (
    parseCamelotKey(input.customKey) ?? parseCamelotKey(input.camelotKey)
  )
}

function wheelDistance(a: number, b: number): number {
  const direct = Math.abs(a - b)
  return Math.min(direct, 12 - direct)
}

/**
 * Camelot compatibility with wheel wrap (1 ↔ 12).
 * Unknown / unparsable keys are neutral (`unknown`), never a hard fail.
 */
export function compareCamelot(
  left: string | null | undefined,
  right: string | null | undefined
): CamelotCompatibility {
  const a = parseCamelotParts(left)
  const b = parseCamelotParts(right)

  if (!a || !b) {
    return 'unknown'
  }

  if (a.key === b.key) {
    return 'exact'
  }

  if (a.number === b.number && a.letter !== b.letter) {
    return 'relative'
  }

  if (a.letter === b.letter && wheelDistance(a.number, b.number) === 1) {
    return 'adjacent'
  }

  return 'incompatible'
}
