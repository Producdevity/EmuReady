import { auth } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { handleFileUpload } from '@/lib/upload'
import getErrorMessage from '@/utils/getErrorMessage'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    const formData = await request.formData()

    const result = await handleFileUpload(formData, userId, 'profiles')

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const response = NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
    })

    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
  } catch (error) {
    console.error('Error uploading profile image:', error)
    const errorMessage = getErrorMessage(error, 'An error occurred during upload')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
