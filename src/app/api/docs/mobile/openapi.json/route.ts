import { NextResponse } from 'next/server'
import { generateOpenAPISpec } from '@/scripts/api/auto-generate-mobile-api-spec'

// Since we can't easily import from scripts directory in Next.js routes,
// we'll inline the spec generation or move it to a lib file
export async function GET() {
  try {
    const spec = generateOpenAPISpec()
    return NextResponse.json(spec)
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error)
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
