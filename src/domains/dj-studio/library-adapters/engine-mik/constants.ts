/**
 * Pilot-only Engine DJ + Mixed In Key → canonical manifest adapter.
 *
 * Commercial DJ Studio MUST NOT require Mixed In Key, Engine DJ, Rekordbox, or Serato.
 * This adapter is optional operator enrichment for personal pilot imports.
 */

export const ENGINE_MIK_EXTERNAL_SOURCE = 'engine-dj+mixed-in-key' as const

export const ENGINE_MIK_ADAPTER_ID = 'engine-mik' as const

/** Default pilot batch id (documented; CLI may override). */
export const LATIN_AFROHOUSE_PILOT_BATCH = 'latin-afrohouse-pilot-001' as const

export const EXPECTED_LATIN_AFROHOUSE_PILOT_TRACKS = 18
