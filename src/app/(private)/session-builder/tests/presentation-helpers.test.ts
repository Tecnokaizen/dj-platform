import { describe, expect, it } from 'vitest'

import {
  formatBpmClassification,
  formatBpmRange,
  formatDurationMode,
  formatDurationMs,
  formatNullableNumber,
  formatNullableText,
  uiTrackPosition,
} from '@/app/(private)/session-builder/presentation'

describe('session builder presentation helpers', () => {
  it('formats durations and null metadata', () => {
    expect(formatDurationMs(0)).toBe('00:00')
    expect(formatDurationMs(324_000)).toBe('05:24')
    expect(formatDurationMs(3_730_000)).toBe('1:02:10')
    expect(formatDurationMs(null)).toBe('—')
    expect(formatNullableNumber(null)).toBe('—')
    expect(formatNullableText(null)).toBe('—')
    expect(formatNullableText('8A')).toBe('8A')
  })

  it('formats BPM and duration mode labels', () => {
    expect(formatDurationMode('exact')).toBe('Exacta')
    expect(formatDurationMode('approximate')).toBe('Aproximada')
    expect(formatDurationMode('unknown')).toBe('No disponible')
    expect(formatBpmClassification('ascending')).toBe('Ascendente')
    expect(formatBpmClassification('insufficient_data')).toBe(
      'Datos insuficientes',
    )
    expect(formatBpmRange(118, 123)).toBe('118 → 123')
    expect(formatBpmRange(118, null)).toBe('Inicio 118')
    expect(formatBpmRange(null, null)).toBe('—')
  })

  it('exposes 1-based UI positions', () => {
    expect(uiTrackPosition(0)).toBe(1)
    expect(uiTrackPosition(4)).toBe(5)
  })
})
