import { checkReadiness } from '@/operations/readiness'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  try {
    await checkReadiness()

    return Response.json(
      { status: 'ready' },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  } catch {
    return Response.json(
      { status: 'not_ready' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }
}

