import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} missing`)
  return v
}

export function r2Client() {
  const accountId = getEnv('R2_ACCOUNT_ID')
  const accessKeyId = getEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = getEnv('R2_SECRET_ACCESS_KEY')
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

export async function presignPutObject(params: {
  bucket: string
  key: string
  contentType: string
  expiresIn?: number
}) {
  const client = r2Client()
  const cmd = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ContentType: params.contentType,
    CacheControl: params.key.endsWith('.apk')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=60',
  })
  const url = await getSignedUrl(client, cmd, { expiresIn: params.expiresIn ?? 900 })
  return { url }
}

export async function putJson(params: {
  bucket: string
  key: string
  body: unknown
  cacheControl?: string
}) {
  const client = r2Client()
  const cmd = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    Body: Buffer.from(JSON.stringify(params.body, null, 2), 'utf8'),
    ContentType: 'application/json',
    CacheControl: params.cacheControl ?? 'public, max-age=60',
  })
  await client.send(cmd)
}

export async function presignGetObject(params: {
  bucket: string
  key: string
  expiresIn?: number
}) {
  const client = r2Client()
  const cmd = new GetObjectCommand({ Bucket: params.bucket, Key: params.key })
  const url = await getSignedUrl(client, cmd, { expiresIn: params.expiresIn ?? 900 })
  return { url }
}

export async function deleteObject(params: { bucket: string; key: string }) {
  const client = r2Client()
  const cmd = new DeleteObjectCommand({ Bucket: params.bucket, Key: params.key })
  await client.send(cmd)
}
