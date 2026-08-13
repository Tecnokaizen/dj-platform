import { describe, expect, it } from 'vitest'

import {
  getPublicEnvironment,
  getServerEnvironment,
} from '@/config/environment'

describe('environment contract', () => {
  it('parses and normalizes the public deployment environment', () => {
    expect(
      getPublicEnvironment({
        NEXT_PUBLIC_APP_URL: 'https://staging.example.com/',
        NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.com///',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      })
    ).toEqual({
      NEXT_PUBLIC_APP_URL: 'https://staging.example.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    })
  })

  it('rejects a missing application origin instead of using localhost', () => {
    expect(() =>
      getPublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.com',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      })
    ).toThrow()
  })

  it('accepts only PostgreSQL runtime URLs', () => {
    expect(
      getServerEnvironment({
        DATABASE_URL: 'postgresql://app_runtime:secret@db:5432/platform',
      })
    ).toEqual({
      DATABASE_URL: 'postgresql://app_runtime:secret@db:5432/platform',
    })

    expect(() =>
      getServerEnvironment({ DATABASE_URL: 'https://example.com/database' })
    ).toThrow()
  })
})
