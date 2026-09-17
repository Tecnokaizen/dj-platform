/**
 * Product presentation helpers for Session Builder (no Domain mutation).
 * Safe for Client Components — pure formatting only.
 */

export function formatDurationMs(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return '—'
  }

  const totalSeconds = Math.floor(value / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatNullableNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—'
  }
  return String(value)
}

export function formatNullableText(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '—'
  }
  return value
}

export function formatDurationMode(
  mode: 'exact' | 'approximate' | 'unknown',
): string {
  switch (mode) {
    case 'exact':
      return 'Exacta'
    case 'approximate':
      return 'Aproximada'
    case 'unknown':
      return 'No disponible'
  }
}

export function formatBpmClassification(
  classification:
    | 'ascending'
    | 'descending'
    | 'steady'
    | 'mixed'
    | 'insufficient_data',
): string {
  switch (classification) {
    case 'ascending':
      return 'Ascendente'
    case 'descending':
      return 'Descendente'
    case 'steady':
      return 'Estable'
    case 'mixed':
      return 'Mixta'
    case 'insufficient_data':
      return 'Datos insuficientes'
  }
}

export function formatBpmRange(
  start: number | null,
  end: number | null,
): string {
  const startLabel = formatNullableNumber(start)
  const endLabel = formatNullableNumber(end)
  if (startLabel === '—' && endLabel === '—') {
    return '—'
  }
  if (startLabel !== '—' && endLabel !== '—') {
    return `${startLabel} → ${endLabel}`
  }
  if (startLabel !== '—') {
    return `Inicio ${startLabel}`
  }
  return `Fin ${endLabel}`
}

export function uiTrackPosition(position: number): number {
  return position + 1
}
