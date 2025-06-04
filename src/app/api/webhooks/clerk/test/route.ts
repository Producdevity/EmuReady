import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    return NextResponse.json({
      message: 'Webhook test endpoint - POST request received',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      bodyLength: body.length,
      headers: {
        'content-type': headers['content-type'],
        'user-agent': headers['user-agent'],
        'svix-id': headers['svix-id'],
        'svix-timestamp': headers['svix-timestamp'],
        'svix-signature': headers['svix-signature'],
      },
      bodyPreview: body.substring(0, 300),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
