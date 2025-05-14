import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/db'

// Set route to be dynamic to prevent caching
export const dynamic = 'force-dynamic'

// File size limit in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Helper function to check if file is an image
function isImage(file: File) {
  return file.type.startsWith('image/')
}

// Main API route handler
export async function POST(request: NextRequest) {
  try {
    // Check authentication - all users can upload profile images
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 },
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    // Validate
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!isImage(file)) {
      return NextResponse.json(
        { error: 'Uploaded file is not an image' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5MB limit' },
        { status: 400 },
      )
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const userId = session.user.id
    const timestamp = Date.now()
    const fileName = `profile-${userId}-${timestamp}.${fileExtension}`

    // Create directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public')
    const uploadDir = join(publicDir, 'uploads', 'profiles')
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    const filePath = join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Generate public URL
    const imageUrl = `/uploads/profiles/${fileName}`

    // Update user profile in the database
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl },
    })

    // Return success response with cache headers
    const response = NextResponse.json({
      success: true,
      imageUrl,
    })

    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
  } catch (error: unknown) {
    console.error('Error uploading profile image:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred during upload'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
