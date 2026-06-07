import { type NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const RETROCATALOG_API_BASE = 'https://retrocatalog.com/api/catalog/retro-handhelds' as const
const MAX_CATALOG_SEGMENT_LENGTH = 120
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u
const CATALOG_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
} as const

function isCatalogSegment(value: string) {
  const trimmedValue = value.trim()
  return (
    trimmedValue.length > 0 &&
    trimmedValue.length <= MAX_CATALOG_SEGMENT_LENGTH &&
    !CONTROL_CHARACTER_PATTERN.test(value)
  )
}

function emptyCatalogResponse() {
  return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } })
}

function catalogUrl(brandName: string, modelName: string) {
  return `${RETROCATALOG_API_BASE}/${encodeURIComponent(brandName.trim())}/${encodeURIComponent(modelName.trim())}`
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ brandName: string; modelName: string }> },
) {
  const { brandName, modelName } = await context.params

  if (!isCatalogSegment(brandName) || !isCatalogSegment(modelName)) {
    return emptyCatalogResponse()
  }

  try {
    const response = await fetch(catalogUrl(brandName, modelName), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      logger.warn('[retrocatalog] Device lookup rejected', {
        status: response.status,
        brandName,
        modelName,
      })

      return emptyCatalogResponse()
    }

    const data: unknown = await response.json()
    if (!Array.isArray(data) || data.length === 0) return emptyCatalogResponse()

    return NextResponse.json(data, { headers: CATALOG_CACHE_HEADERS })
  } catch (error) {
    logger.warn('[retrocatalog] Device lookup failed', {
      error: error instanceof Error ? error.message : String(error),
      brandName,
      modelName,
    })

    return emptyCatalogResponse()
  }
}
