import { type NextRequest, NextResponse } from 'next/server'

// Common image extensions and their corresponding MIME types
const IMAGE_EXTENSIONS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
}

function isImageUrl(url: string): boolean {
  const urlLower = url.toLowerCase()
  return Object.keys(IMAGE_EXTENSIONS).some((ext) => urlLower.includes(ext))
}

function getContentTypeFromUrl(url: string): string | null {
  const urlLower = url.toLowerCase()
  for (const [ext, mimeType] of Object.entries(IMAGE_EXTENSIONS)) {
    if (urlLower.includes(ext)) {
      return mimeType
    }
  }
  return null
}

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

    // Check if it's an image by content-type OR by file extension
    const isImageByContentType = contentType && contentType.startsWith('image/')
    const isImageByUrl = isImageUrl(url)

    if (!isImageByContentType && !isImageByUrl) {
      return new NextResponse('Not an image', { status: 400 })
    }

    const imageData = await response.arrayBuffer()

    // Use the proper content-type from the response, or determine it from the URL
    let finalContentType = contentType
    if (!isImageByContentType && isImageByUrl) {
      finalContentType = getContentTypeFromUrl(url) || 'image/jpeg'
    }

    return new NextResponse(imageData, {
      headers: {
        'Content-Type': finalContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Invalid URL or server error', { status: 400 })
  }
}
