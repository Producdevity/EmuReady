import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCacheMetrics } from '@/lib/cache/seo-cache'
import { exportMetrics, seoMetrics } from '@/lib/monitoring/seo-metrics'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

/**
 * API endpoint to get cache metrics
 * Only accessible by moderators and above
 */
export async function GET() {
  const session = await auth()

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has moderator permissions or higher
  const { sessionClaims } = session
  const metadata = sessionClaims?.metadata as { role?: Role } | undefined
  const userRole = metadata?.role

  if (!userRole || !hasRolePermission(userRole, Role.MODERATOR)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cacheMetrics = getCacheMetrics()
  const seoData = seoMetrics.getAggregatedMetrics()
  const exportData = exportMetrics()

  // Combine all metrics
  const combinedMetrics = {
    // Cache metrics from seo-cache
    ...cacheMetrics,
    // Add seo-metrics data
    entries: exportData.cache.entries.length,
    size: exportData.cache.totalSize,
    hitRate: seoData.cacheHitRate,
    missRate: 100 - seoData.cacheHitRate,
    avgResponseTime: seoData.avgTotalTime,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(combinedMetrics)
}
