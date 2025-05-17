import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    new URL(url) // Validate URL

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)',
      },
    })

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 })
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      return new NextResponse('Not an image', { status: 400 })
    }

    const imageData = await response.arrayBuffer()

    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Invalid URL or server error', { status: 400 })
  }
}
