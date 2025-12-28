import { type NextRequest, NextResponse } from 'next/server'

const RETROCATALOG_API_BASE = 'https://retrocatalog.com/api/catalog/retro-handhelds' as const

/**
 * Proxy for RetroCatalog API
 * Route: /api/retrocatalog/[brandName]/[modelName]
 */
export async function GET(_req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params

  if (!path || path.length < 2) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const [brandName, modelName] = path
  const url = `${RETROCATALOG_API_BASE}/${encodeURIComponent(brandName)}/${encodeURIComponent(modelName)}`

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24 hours on the edge
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array for not found - this is expected behavior, not an error
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
          },
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch from RetroCatalog' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to connect to RetroCatalog' }, { status: 502 })
  }
}
