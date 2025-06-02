import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { Role } from '@orm'
import { hasPermission } from '@/utils/permissions'
import { prisma } from '@/server/db'
import getErrorMessage from '@/utils/getErrorMessage'

// Set route to be dynamic to prevent caching
export const dynamic = 'force-dynamic'

// File size limit in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image types and extensions
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']

// Helper function to check if file is an image
function isImage(file: File) {
  // Check MIME type first
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false
  }

  // Then verify extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ALLOWED_EXTENSIONS.includes(fileExtension)
}

// TODO: consider only allowing urls
export async function POST(request: NextRequest) {
  try {
    // Check authentication - verify user has AUTHOR role
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 },
      )
    }

    // Check user role for upload permissions
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })
    
    if (!user || !hasPermission(user.role, Role.AUTHOR)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
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

    // Extract and validate file extension from original name
    const originalExtension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const fileExtension = ALLOWED_EXTENSIONS.includes(originalExtension)
      ? originalExtension
      : 'jpg' // Fallback to jpg if extension is invalid

    // Create unique filename with timestamp and random string for additional security
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const fileName = `game-${userId}-${timestamp}-${randomString}.${fileExtension}`

    // Create directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public')
    const uploadDir = join(publicDir, 'uploads', 'games')
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    const filePath = join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Generate public URL
    const imageUrl = `/uploads/games/${fileName}`

    // Return success response with cache headers
    const response = NextResponse.json({
      success: true,
      imageUrl,
    })

    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0')

    return response
  } catch (error) {
    console.error('Error uploading game image:', error)
    const errorMessage = getErrorMessage(
      error,
      'An error occurred during upload',
    )
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
