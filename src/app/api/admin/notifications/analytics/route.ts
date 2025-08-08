import { auth } from '@clerk/nextjs/server'
import { type NextRequest } from 'next/server'
import { prisma } from '@/server/db'
import { notificationAnalyticsService } from '@/server/notifications/analyticsService'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!hasPermission(user?.role, Role.ADMIN)) {
      return new Response('Forbidden', { status: 403 })
    }

    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const type = searchParams.get('type') || 'overview'

    switch (type) {
      case 'overview':
        const overallMetrics = await notificationAnalyticsService.getOverallMetrics(
          startDate,
          endDate,
        )
        return Response.json(overallMetrics)

      case 'channels':
        const channelMetrics = await notificationAnalyticsService.getChannelMetrics(
          startDate,
          endDate,
        )
        return Response.json(channelMetrics)

      case 'types':
        const typeMetrics = await notificationAnalyticsService.getTypeMetrics(startDate, endDate)
        return Response.json(typeMetrics)

      case 'users':
        const limit = parseInt(searchParams.get('limit') || '100')
        const userMetrics = await notificationAnalyticsService.getUserEngagementMetrics(
          limit,
          startDate,
          endDate,
        )
        return Response.json(userMetrics)

      case 'timeseries':
        const granularity = (searchParams.get('granularity') as 'day' | 'week' | 'month') || 'day'
        const defaultStart = new Date()
        defaultStart.setDate(defaultStart.getDate() - 30) // Last 30 days
        const defaultEnd = new Date()

        const timeSeriesData = await notificationAnalyticsService.getTimeSeriesData(
          startDate || defaultStart,
          endDate || defaultEnd,
          granularity,
        )
        return Response.json(timeSeriesData)

      case 'top-performing':
        const topLimit = parseInt(searchParams.get('limit') || '10')
        const topTypes = await notificationAnalyticsService.getTopPerformingTypes(
          topLimit,
          startDate,
          endDate,
        )
        return Response.json(topTypes)

      default:
        return new Response('Invalid analytics type', { status: 400 })
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
