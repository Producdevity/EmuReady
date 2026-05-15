import { type NextRequest } from 'next/server'

/**
 * Hardcoded allowed origins for production
 * These are always included regardless of environment variables
 */
const PRODUCTION_ORIGINS = [
  'https://emuready.com',
  'https://www.emuready.com',
  'https://dev.emuready.com',
  'https://staging.emuready.com',
]

/**
 * Partner sites that consume our API
 */
const PARTNER_ORIGINS = [
  'https://eden-emu.dev',
  'https://eden-emulator-github-io.vercel.app',
  'https://retrocatalog.com',
  'https://steamuready.com',
]

const LOCAL_TEST_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
]

function addMissingOrigins(origins: string[], additionalOrigins: string[]) {
  for (const origin of additionalOrigins) {
    if (!origins.includes(origin)) origins.push(origin)
  }
}

/**
 * Get allowed CORS origins from environment variables
 * This is the single source of truth for allowed origins
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS

  let origins: string[]

  if (envOrigins) {
    // Use environment variable origins if provided
    origins = envOrigins.split(',').map((origin) => origin.trim())
  } else if (process.env.NODE_ENV === 'development') {
    // Default to localhost for development
    origins = [...LOCAL_TEST_ORIGINS]
  } else {
    // In production without env vars, use hardcoded production origins
    origins = [...PRODUCTION_ORIGINS]
  }

  if (process.env.CI === 'true') {
    addMissingOrigins(origins, LOCAL_TEST_ORIGINS)
  }

  // Always include production origins if we're in production
  if (process.env.NODE_ENV === 'production') {
    addMissingOrigins(origins, PRODUCTION_ORIGINS)
  }

  // Always include partner origins
  addMissingOrigins(origins, PARTNER_ORIGINS)

  // Always include mobile app origins
  const mobileOrigins = ['capacitor://localhost', 'ionic://localhost']
  addMissingOrigins(origins, mobileOrigins)

  // Include app URL if set
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && !origins.includes(appUrl)) origins.push(appUrl)

  return origins
}

export function getOriginFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.protocol}//${parsedUrl.host}`
  } catch {
    return null
  }
}

export function isAllowedRequestOrigin(params: {
  allowedOrigins: string[]
  source: string | null
}): boolean {
  if (!params.source) return false

  const sourceOrigin = getOriginFromUrl(params.source)
  if (!sourceOrigin) return params.allowedOrigins.includes(params.source)

  return params.allowedOrigins.includes(sourceOrigin)
}

/**
 * Get CORS headers for a request
 */
export function getCORSHeaders(request?: NextRequest): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()
  const origin = request?.headers.get('origin') || ''

  // In production, require explicit origin configuration
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.error('CORS Error: No allowed origins configured in production')
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  }

  // Check if the origin is allowed
  const allowOrigin =
    allowedOrigins.length === 0
      ? '*' // Only in development
      : allowedOrigins.includes(origin)
        ? origin
        : 'null' // Deny if origin not in allowed list

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}
