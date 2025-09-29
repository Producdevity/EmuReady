#!/usr/bin/env tsx
/*
 * Uploads an Android APK to Cloudflare R2, writes latest.json, and (optionally) registers the release via tRPC.
 *
 * Usage:
 *   tsx scripts/upload-android-release.ts \
 *     --file ./dist/EmuReady.apk \
 *     --channel stable \
 *     --versionName 1.2.3 \
 *     --versionCode 123 \
 *     [--notes "Bug fixes"]
 *
 * Required env:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
 * Optional env for auto-register:
 *   APP_URL (e.g. https://emuready.com), INTERNAL_API_KEY
 */
import { createHash } from 'node:crypto'
import { createReadStream, statSync } from 'node:fs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

type Args = {
  file: string
  channel: 'stable' | 'beta'
  versionName: string
  versionCode: number
  notes?: string
}

function parseArgs(argv: string[]): Args {
  const out: Record<string, string> = {}
  for (let i = 2; i < argv.length; i += 2) {
    const k = argv[i]
    const v = argv[i + 1]
    if (!k?.startsWith('--')) continue
    out[k.slice(2)] = v
  }
  if (!out.file || !out.channel || !out.versionName || !out.versionCode) {
    throw new Error('Missing required args: --file --channel --versionName --versionCode')
  }
  if (out.channel !== 'stable' && out.channel !== 'beta')
    throw new Error('channel must be stable|beta')
  return {
    file: out.file,
    channel: out.channel as 'stable' | 'beta',
    versionName: out.versionName,
    versionCode: Number(out.versionCode),
    notes: out.notes,
  }
}

async function sha256File(file: string): Promise<string> {
  const hash = createHash('sha256')
  const stream = createReadStream(file)
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve())
    stream.on('error', reject)
  })
  return hash.digest('hex')
}

async function main() {
  const args = parseArgs(process.argv)

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicBase = process.env.R2_PUBLIC_BASE_URL // e.g., https://cdn.emuready.com

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    throw new Error(
      'Missing R2 env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL',
    )
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`
  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  const fileName = `emuready_${args.versionName}.apk`
  const key = `android/${args.channel}/${fileName}`
  const size = statSync(args.file).size
  const sha256 = await sha256File(args.file)

  // Upload APK
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(args.file),
      ContentType: 'application/vnd.android.package-archive',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  const apkUrl = `${publicBase}/${key}`

  // Upload latest.json
  const latest = {
    channel: args.channel,
    versionCode: args.versionCode,
    versionName: args.versionName,
    apkUrl,
    sha256,
    sizeBytes: size,
    notesUrl: undefined as string | undefined,
  }
  const latestKey = `android/${args.channel}/latest.json`
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: latestKey,
      Body: Buffer.from(JSON.stringify(latest, null, 2), 'utf8'),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=60',
    }),
  )

  console.log('✅ Uploaded APK:', apkUrl)
  console.log('✅ Updated latest.json:', `${publicBase}/${latestKey}`)

  // Optional: auto-register release via TRPC if server details present
  const appUrl = process.env.APP_URL
  const internalKey = process.env.INTERNAL_API_KEY
  if (appUrl && internalKey) {
    const input = {
      channel: args.channel,
      versionCode: args.versionCode,
      versionName: args.versionName,
      fileKey: key,
      fileSha256: sha256,
      sizeBytes: size,
      notes: args.notes ?? undefined,
    }
    const url = `${appUrl.replace(/\/$/, '')}/api/trpc/adminReleases.create`
    const res = await fetch(
      `${url}?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: input } }))}`,
      {
        method: 'POST',
        headers: { 'x-api-key': internalKey },
      },
    )
    if (!res.ok) {
      console.warn(
        '⚠️ Failed to auto-register release via TRPC. You can create it in Admin → Android Releases.',
      )
    } else {
      console.log('✅ Registered release in Admin → Android Releases')
    }
  } else {
    console.log(
      'ℹ️ Skipped auto-register (APP_URL or INTERNAL_API_KEY missing). Use Admin → Android Releases to add metadata.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
