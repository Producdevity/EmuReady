import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { auth } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/server/db'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

function isImage(file: File) {
  return file.type.startsWith('image/')
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    // Check user role for upload permissions
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!user || !hasRolePermission(user.role, Role.USER)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!isImage(file)) {
      return NextResponse.json({ error: 'Uploaded file is not an image' }, { status: 400 })
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `game-${timestamp}.${fileExtension}`

    // Create directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public')
    const uploadDir = join(publicDir, 'uploads', 'games')
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    const filePath = join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const imageUrl = `/uploads/games/${fileName}`

    return NextResponse.json({ success: true, imageUrl })
  } catch (error) {
    console.error('Error uploading file:', error)
    const errorMessage = getErrorMessage(error, 'An error occurred during upload')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
