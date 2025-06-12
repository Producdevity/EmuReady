import { auth } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { handleFileUpload } from '@/lib/upload'
import getErrorMessage from '@/utils/getErrorMessage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 },
      )
    }

    // Get form data
    const formData = await request.formData()

    // Handle upload using shared utility
    const result = await handleFileUpload(formData, userId, 'profiles')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      )
    }

    // Return success response
    const response = NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
    })

    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
  } catch (error) {
    console.error('Error uploading profile image:', error)
    const errorMessage = getErrorMessage(
      error,
      'An error occurred during upload',
    )
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
