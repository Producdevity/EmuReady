import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/server/db'
import { IMAGE_EXTENSIONS, type ImageExtension } from '@/utils/imageValidation'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'

// File size limit in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image types and extensions
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS

// Upload configuration types
export interface UploadConfig {
  directory: string
  filenamePrefix: string
  requiredRole?: Role
  updateUserProfile?: boolean
}

// Predefined upload configurations
export const UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  games: {
    directory: 'games',
    filenamePrefix: 'game',
    requiredRole: Role.USER,
  },
  profiles: {
    directory: 'profiles',
    filenamePrefix: 'profile',
    updateUserProfile: true,
  },
} as const

export type UploadType = keyof typeof UPLOAD_CONFIGS

// Sanitize userId to prevent path traversal and filesystem issues
function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

// Validation functions
export function isValidImage(file: File): boolean {
  if (!file) return false

  // Check MIME type first
  if (!ALLOWED_MIME_TYPES.includes(file.type)) return false

  // Then verify extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ALLOWED_EXTENSIONS.includes(fileExtension as ImageExtension)
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE
}

export function getFileExtension(filename: string): ImageExtension {
  const originalExtension = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  return ALLOWED_EXTENSIONS.includes(originalExtension as ImageExtension)
    ? (originalExtension as ImageExtension)
    : 'jpg'
}

type PermissionCheckResult =
  | { success: true }
  | { success: false; error: string; status: number }

// Permission checking
export async function checkUploadPermissions(
  userId: string,
  config: UploadConfig,
): Promise<PermissionCheckResult> {
  if (!config.requiredRole) return { success: true }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  })

  if (!user) return { success: false, error: 'User not found', status: 404 }

  if (!hasPermission(user.role, config.requiredRole)) {
    return {
      success: false,
      error: 'Insufficient permissions',
      status: 403,
    }
  }

  return { success: true }
}

type UploadFileResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string }

// File upload logic
export async function uploadFile(
  file: File,
  userId: string,
  config: UploadConfig,
): Promise<UploadFileResult> {
  try {
    // Generate unique filename
    const fileExtension = getFileExtension(file.name)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const sanitizedUserId = sanitizeUserId(userId)
    const fileName = `${config.filenamePrefix}-${sanitizedUserId}-${timestamp}-${randomString}.${fileExtension}`

    // Create directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public')
    const uploadDir = join(publicDir, 'uploads', config.directory)
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    const filePath = join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Generate public URL
    const imageUrl = `/uploads/${config.directory}/${fileName}`

    // Update user profile if configured
    if (config.updateUserProfile) {
      await prisma.user.update({
        where: { clerkId: userId },
        data: { profileImage: imageUrl },
      })
    }

    return {
      success: true,
      imageUrl,
    }
  } catch (error) {
    console.error('Error in uploadFile:', error)
    return {
      success: false,
      error: 'Failed to upload file',
    }
  }
}

type HandleFileUploadResult =
  | { success: true; imageUrl: string }
  | { success: false; error: string; status: number }

// Main upload handler
export async function handleFileUpload(
  formData: FormData,
  userId: string,
  uploadType: UploadType,
): Promise<HandleFileUploadResult> {
  const config = UPLOAD_CONFIGS[uploadType]
  const file = formData.get('file') as File | null

  if (!file) return { success: false, error: 'No file uploaded', status: 400 }

  // Validate file type
  if (!isValidImage(file)) {
    return {
      success: false,
      error: 'Uploaded file must be a valid image (JPG, PNG, GIF, or WebP)',
      status: 400,
    }
  }

  // Validate file size
  if (!validateFileSize(file)) {
    return {
      success: false,
      error: 'File size exceeds the 5MB limit',
      status: 400,
    }
  }

  // Check permissions
  const permissionCheck = await checkUploadPermissions(userId, config)
  if (!permissionCheck.success) return permissionCheck

  // Upload file
  const uploadResult = await uploadFile(file, userId, config)
  if (!uploadResult.success) {
    return {
      success: false,
      error: uploadResult.error,
      status: 500,
    }
  }

  return {
    success: true,
    imageUrl: uploadResult.imageUrl,
  }
}
