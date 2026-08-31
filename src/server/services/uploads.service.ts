import { randomUUID } from 'node:crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { AppError } from '@/lib/errors'
import { r2Client } from '@/server/services/r2.service'
import type { ImageExtension } from '@/utils/imageValidation'

const UPLOAD_PREFIX = 'uploads'

export interface StoredUpload {
  url: string
  key: string
  bucket: string
}

interface UploadsConfig {
  bucket: string
  publicBase: string
}

function getUploadsConfig(): UploadsConfig {
  const uploadsBucket = process.env.R2_UPLOADS_BUCKET
  const uploadsPublicBase = process.env.R2_UPLOADS_PUBLIC_BASE_URL

  if (Boolean(uploadsBucket) !== Boolean(uploadsPublicBase)) {
    return AppError.internalError(
      'R2_UPLOADS_BUCKET and R2_UPLOADS_PUBLIC_BASE_URL must be set together',
    )
  }

  const bucket = uploadsBucket || process.env.R2_BUCKET
  const publicBase = uploadsPublicBase || process.env.R2_PUBLIC_BASE_URL

  if (!bucket) {
    return AppError.internalError('R2_UPLOADS_BUCKET (or R2_BUCKET) is required for uploads')
  }
  if (!publicBase) {
    return AppError.internalError(
      'R2_UPLOADS_PUBLIC_BASE_URL (or R2_PUBLIC_BASE_URL) is required for uploads',
    )
  }

  return { bucket, publicBase: validatePublicBase(publicBase) }
}

function validatePublicBase(value: string): string {
  let base: URL
  try {
    base = new URL(value)
  } catch {
    return AppError.internalError('R2 uploads public base URL must be a valid HTTPS URL')
  }

  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    return AppError.internalError('R2 uploads public base URL must be a valid HTTPS URL')
  }

  return base.toString().replace(/\/+$/, '')
}

export async function putUpload(params: {
  directory: string
  body: Buffer
  contentType: string
  ext: ImageExtension
}): Promise<StoredUpload> {
  const config = getUploadsConfig()

  const key = `${UPLOAD_PREFIX}/${params.directory}/${randomUUID()}.${params.ext}`
  await r2Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return { url: `${config.publicBase}/${key}`, key, bucket: config.bucket }
}
