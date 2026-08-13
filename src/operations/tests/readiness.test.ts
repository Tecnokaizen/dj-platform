import { describe, expect, it, vi } from 'vitest'

import { checkReadiness } from '@/operations/readiness'

const publicEnvironment = {
  NEXT_PUBLIC_APP_URL: 'https://staging.example.com',
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.com',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
}

const serverEnvironment = {
  DATABASE_URL: 'postgresql://app_runtime:secret@db:5432/platform',
}

describe('readiness', () => {
  it('checks database, Auth and PostgREST', async () => {
    const database = vi.fn().mockResolvedValue(undefined)
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }))

    await expect(
      checkReadiness({
        publicEnvironment,
        serverEnvironment,
        checkDatabase: database,
        fetch: request,
      })
    ).resolves.toBeUndefined()

    expect(database).toHaveBeenCalledWith(serverEnvironment.DATABASE_URL)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('fails when Auth is unavailable', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }))

    await expect(
      checkReadiness({
        publicEnvironment,
        serverEnvironment,
        checkDatabase: vi.fn().mockResolvedValue(undefined),
        fetch: request,
      })
    ).rejects.toThrow('auth readiness failed')
  })

  it('fails when the database check rejects', async () => {
    await expect(
      checkReadiness({
        publicEnvironment,
        serverEnvironment,
        checkDatabase: vi.fn().mockRejectedValue(new Error('connection refused')),
        fetch: vi.fn<typeof fetch>().mockResolvedValue(new Response()),
      })
    ).rejects.toThrow('connection refused')
  })
})

