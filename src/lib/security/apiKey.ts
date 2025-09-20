import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_PREFIX = 'ERK'
const KEY_SEPARATOR = '.'
const PREFIX_BYTE_LENGTH = 6 // 12 hex characters
const SALT_BYTE_LENGTH = 16
const HASH_LENGTH = 64

function toBase64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export interface GeneratedApiKey {
  key: string
  prefix: string
  payload: string
  salt: string
  hash: string
}

export interface ParsedApiKey {
  prefix: string
  payload: string
}

export function generateApiKey(): GeneratedApiKey {
  const prefix = randomBytes(PREFIX_BYTE_LENGTH).toString('hex')
  const payload = toBase64Url(randomBytes(32))
  const salt = randomBytes(SALT_BYTE_LENGTH).toString('hex')
  const hash = hashApiKeyPayload(payload, salt)

  const key = [KEY_PREFIX, prefix, payload].join(KEY_SEPARATOR)

  return { key, prefix, payload, salt, hash }
}

export function parseApiKey(rawKey: string): ParsedApiKey | null {
  if (!rawKey) return null
  const segments = rawKey.split(KEY_SEPARATOR)
  if (segments.length !== 3) return null

  const [prefixLiteral, prefix, payload] = segments
  if (prefixLiteral !== KEY_PREFIX) return null
  if (!prefix || !payload) return null

  return { prefix, payload }
}

export function hashApiKeyPayload(payload: string, salt: string): string {
  const derived = scryptSync(payload, salt, HASH_LENGTH)
  return derived.toString('hex')
}

export function verifyApiKey(payload: string, salt: string, expectedHash: string): boolean {
  const calculated = hashApiKeyPayload(payload, salt)
  const expectedBuffer = Buffer.from(expectedHash, 'hex')
  const calculatedBuffer = Buffer.from(calculated, 'hex')
  if (expectedBuffer.length !== calculatedBuffer.length) return false
  return timingSafeEqual(expectedBuffer, calculatedBuffer)
}

export function maskApiKey(rawKey: string): string {
  const parsed = parseApiKey(rawKey)
  if (!parsed) return 'Invalid API Key'
  const visibleSuffixLength = 4
  const maskedPayload = `${'*'.repeat(Math.max(parsed.payload.length - visibleSuffixLength, 0))}${parsed.payload.slice(-visibleSuffixLength)}`
  return reconstructFromPrefix(parsed.prefix, maskedPayload)
}

export function reconstructFromPrefix(prefix: string, payload: string): string {
  return [KEY_PREFIX, prefix, payload].join(KEY_SEPARATOR)
}
