/**
 * Build minimal untrusted Save payload from draft + generation prompt snapshot.
 * Server revalidates everything — this only shapes client → action JSON.
 */
export function buildSessionBuilderSavePayload(params: {
  name: string
  prompt: string
  tracks: Array<{
    libraryItemId: string
    transitionNote: string | null
  }>
}): {
  name: string
  prompt: string
  tracks: Array<{
    libraryItemId: string
    transitionNote: string | null
  }>
} {
  return {
    name: params.name,
    prompt: params.prompt,
    tracks: params.tracks.map((track) => ({
      libraryItemId: track.libraryItemId,
      transitionNote: track.transitionNote,
    })),
  }
}

export function shouldShowSessionBuilderSaveCta(params: {
  hasDraft: boolean
  savedPlaylistId: string | null
}): boolean {
  return params.hasDraft && params.savedPlaylistId === null
}
