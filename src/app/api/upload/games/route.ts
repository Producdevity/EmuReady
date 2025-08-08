import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { handleFileUpload } from '@/lib/upload'
import getErrorMessage from '@/utils/getErrorMessage'
import type { NextRequest } from 'next/server'

// Set route to be dynamic to prevent caching
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()

    // Handle upload using shared utility
    const result = await handleFileUpload(formData, userId, 'games')

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // Return success response with cache headers
    const response = NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
    })

    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
  } catch (error) {
    console.error('Error uploading game image:', error)
    const errorMessage = getErrorMessage(error, 'An error occurred during upload')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
