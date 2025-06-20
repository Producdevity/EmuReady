import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/utils/auth'

interface AnalyticsEvent {
  event: string
  category?: string
  action?: string
  label?: string
  value?: number
  user_id?: string
  session_id?: string
  page?: string
  timestamp?: number
  [key: string]: unknown
}

/**
 * Server-side analytics endpoint
 * Handles analytics events for server-side processing, rate limiting, and external service integration
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    const referer = headersList.get('referer') || ''
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown'

    // Parse the analytics event
    const body = await request.json()
    const event: AnalyticsEvent = {
      ...body,
      timestamp: Date.now(),
    }

    // Validate required fields
    if (!event.event || typeof event.event !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid event name' },
        { status: 400 },
      )
    }

    // Get current user if authenticated
    const user = await getCurrentUser()
    if (user) {
      event.user_id = user.id
    }

    // Add server-side context
    event.server_context = {
      ip: ip.substring(0, 12), // Truncate IP for privacy
      user_agent: userAgent.substring(0, 200), // Truncate user agent
      referer: referer.substring(0, 200), // Truncate referer
      timestamp: new Date().toISOString(),
    }

    // Development: Log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Server Analytics Event:', {
        event: event.event,
        category: event.category,
        action: event.action,
        user_id: event.user_id,
        page: event.page,
        timestamp: new Date(event.timestamp || Date.now()).toISOString(),
      })
      return NextResponse.json({ success: true, mode: 'development' })
    }

    // Production: Send to external analytics services
    const promises: Promise<unknown>[] = []

    // TODO: decide what is the least scummy analytics tool and use that
    // NOTE: They are all garbage, roll our own?
    if (process.env.GA_MEASUREMENT_ID && process.env.GA_API_SECRET) {
      promises.push(sendToGoogleAnalytics(event))
    }

    if (process.env.POSTHOG_API_KEY) {
      promises.push(sendToPostHog(event))
    }

    if (process.env.MIXPANEL_TOKEN) {
      promises.push(sendToMixpanel(event))
    }

    // Execute all analytics sends in parallel, but don't fail if any fail
    const results = await Promise.allSettled(promises)

    // Log any failures in production
    // Note to self, don't expose to client, dumbass
    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length > 0) {
      console.error(
        'Analytics service failures:',
        failures.map((f) => (f.status === 'rejected' ? f.reason : null)),
      )
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: failures.length,
    })
  } catch (error) {
    console.error('Analytics endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

/**
 * Send event to Google Analytics 4 via Measurement Protocol
 */
async function sendToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
  const measurementId = process.env.GA_MEASUREMENT_ID!
  const apiSecret = process.env.GA_API_SECRET!

  const payload = {
    client_id: event.session_id || event.user_id || 'anonymous',
    events: [
      {
        name: event.event,
        params: {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          page_location: event.page,
          user_id: event.user_id,
          ...Object.fromEntries(
            Object.entries(event).filter(
              ([key]) =>
                ![
                  'event',
                  'category',
                  'label',
                  'value',
                  'page',
                  'user_id',
                  'session_id',
                  'timestamp',
                  'server_context',
                ].includes(key),
            ),
          ),
        },
      },
    ],
  }

  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    throw new Error(`GA4 API error: ${response.status}`)
  }
}

/**
 * Send event to PostHog
 */
async function sendToPostHog(event: AnalyticsEvent): Promise<void> {
  const apiKey = process.env.POSTHOG_API_KEY!
  const apiHost = process.env.POSTHOG_API_HOST || 'https://app.posthog.com'

  const payload = {
    api_key: apiKey,
    event: event.event,
    distinct_id: event.user_id || event.session_id || 'anonymous',
    properties: {
      ...event,
      $current_url: event.page,
      $lib: 'EmuReady-server',
    },
    timestamp: event.timestamp,
  }

  const response = await fetch(`${apiHost}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`PostHog API error: ${response.status}`)
  }
}

/**
 * Send event to Mixpanel
 */
async function sendToMixpanel(event: AnalyticsEvent): Promise<void> {
  const token = process.env.MIXPANEL_TOKEN!

  const payload = {
    event: event.event,
    properties: {
      token,
      distinct_id: event.user_id || event.session_id || 'anonymous',
      time: event.timestamp,
      ...event,
    },
  }

  const encodedData = Buffer.from(JSON.stringify(payload)).toString('base64')

  const response = await fetch('https://api.mixpanel.com/track/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(encodedData)}`,
  })

  if (!response.ok) {
    throw new Error(`Mixpanel API error: ${response.status}`)
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
