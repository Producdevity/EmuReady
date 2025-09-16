import { auth } from '@clerk/nextjs/server'
import { type NextRequest, NextResponse } from 'next/server'
import {
  warmAllCaches,
  warmPopularGames,
  warmRecentListings,
  warmSitemapData,
} from '@/server/cache/warming'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

/**
 * API endpoint to manually trigger cache warming
 * Only accessible by admins
 */
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has admin permissions
  const { sessionClaims } = session
  const metadata = sessionClaims?.metadata as { role?: Role } | undefined
  const userRole = metadata?.role

  if (!userRole || !hasRolePermission(userRole, Role.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { strategy = 'all' } = body

    let result

    switch (strategy) {
      case 'games':
        result = await warmPopularGames(50)
        break
      case 'listings':
        result = await warmRecentListings(100)
        break
      case 'sitemap':
        result = await warmSitemapData()
        break
      case 'all':
      default:
        result = await warmAllCaches()
        break
    }

    return NextResponse.json({
      success: true,
      ...result,
      strategy,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cache warming error:', error)
    // Don't expose internal error details to client
    return NextResponse.json({ error: 'Failed to warm cache' }, { status: 500 })
  }
}
