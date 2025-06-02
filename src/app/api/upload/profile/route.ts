import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { prisma } from '@/server/db'
import getErrorMessage from '@/utils/getErrorMessage'

export const dynamic = 'force-dynamic'

// File size limit in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']

function isImage(file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ALLOWED_EXTENSIONS.includes(fileExtension)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!isImage(file)) {
      return NextResponse.json(
        {
          error: 'Uploaded file must be a valid image (JPG, PNG, GIF, or WebP)',
        },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5MB limit' },
        { status: 400 },
      )
    }

    const originalExtension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const fileExtension = ALLOWED_EXTENSIONS.includes(originalExtension)
      ? originalExtension
      : 'jpg' // Fallback to jpg if extension is invalid

    // Create unique filename with timestamp and random string for additional security
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const fileName = `profile-${userId}-${timestamp}-${randomString}.${fileExtension}`

    // Create directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public')
    const uploadDir = join(publicDir, 'uploads', 'profiles')
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    const filePath = join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const imageUrl = `/uploads/profiles/${fileName}`

    // Update user profile image in database
    await prisma.user.update({
      where: { clerkId: userId },
      data: { profileImage: imageUrl },
    })

    const response = NextResponse.json({
      success: true,
      imageUrl,
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
