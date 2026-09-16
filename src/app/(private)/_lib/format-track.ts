type ArtistCredit = {
  creditedName: string | null
  artist: { name: string }
}

export function formatArtistCredits(artists: ArtistCredit[]): string {
  if (artists.length === 0) {
    return 'Artista desconocido'
  }

  return artists
    .map((entry) => entry.creditedName?.trim() || entry.artist.name)
    .join(', ')
}

export function formatBpm(value: { toString(): string } | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const numeric = typeof value === 'number' ? value : Number(value.toString())
  if (Number.isNaN(numeric)) {
    return '—'
  }

  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1)
}
