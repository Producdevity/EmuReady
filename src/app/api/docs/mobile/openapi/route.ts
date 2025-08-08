import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public/api-docs/mobile-openapi.json')
    const openApiSpec = JSON.parse(readFileSync(filePath, 'utf-8'))

    return NextResponse.json(openApiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error)
    return NextResponse.json(
      {
        error: 'OpenAPI specification not found. Run `npm run docs:generate` to generate it.',
      },
      { status: 404 },
    )
  }
}
