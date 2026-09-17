import { describe, expect, it } from 'vitest'

import {
  getSessionBuilderProviderLabel,
  getSessionBuilderProviderUiState,
  SESSION_BUILDER_PROVIDER_LABELS,
} from '@/lib/ai/config/session-builder-provider-ui'

const SECRET = 'sk-test-P4-MUST-NOT-LEAK'

describe('getSessionBuilderProviderUiState', () => {
  it('returns mock for absent AI env', () => {
    const state = getSessionBuilderProviderUiState({})
    expect(state).toEqual({ kind: 'mock' })
    expect(getSessionBuilderProviderLabel(state.kind)).toBe(
      SESSION_BUILDER_PROVIDER_LABELS.mock,
    )
    expect(JSON.stringify(state)).not.toContain('apiKey')
    expect(JSON.stringify(state)).not.toContain('model')
  })

  it('returns openai without secrets when configured', () => {
    const state = getSessionBuilderProviderUiState({
      SESSION_BUILDER_PROVIDER: 'openai',
      OPENAI_API_KEY: SECRET,
      SESSION_BUILDER_OPENAI_MODEL: 'gpt-5.6-terra',
    })
    expect(state).toEqual({ kind: 'openai' })
    expect(getSessionBuilderProviderLabel(state.kind)).toBe(
      'Generador IA',
    )
    expect(JSON.stringify(state)).not.toContain(SECRET)
    expect(JSON.stringify(state)).not.toContain('gpt-5.6-terra')
    expect(JSON.stringify(state)).not.toContain('OPENAI_API_KEY')
    expect(JSON.stringify(state)).not.toContain('apiKey')
  })

  it('returns unavailable for invalid config without crashing', () => {
    const state = getSessionBuilderProviderUiState({
      SESSION_BUILDER_PROVIDER: 'opneai',
      OPENAI_API_KEY: SECRET,
    })
    expect(state).toEqual({ kind: 'unavailable' })
    expect(getSessionBuilderProviderLabel(state.kind)).toBe(
      'Generador no disponible',
    )
    expect(JSON.stringify(state)).not.toContain(SECRET)
  })

  it('returns unavailable when openai key is missing', () => {
    expect(
      getSessionBuilderProviderUiState({
        SESSION_BUILDER_PROVIDER: 'openai',
      }),
    ).toEqual({ kind: 'unavailable' })
  })
})
