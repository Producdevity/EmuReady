import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'
import { authOptions } from '@/server/auth'
import getErrorMessage from '@/utils/getErrorMessage'

function isImage(file: File) {
  return file.type.startsWith('image/')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.role, Role.AUTHOR)) {
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
        { error: 'Uploaded file is not an image' },
        { status: 400 },
      )
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
    const errorMessage = getErrorMessage(
      error,
      'An error occurred during upload',
    )
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
