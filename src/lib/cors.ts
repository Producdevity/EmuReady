import { type NextRequest } from 'next/server'

/**
 * Get allowed CORS origins from environment variables
 */
export function getAllowedOrigins(): string[] {
  const envOrigins =
    process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS

  if (!envOrigins) {
    // Default to localhost for development
    if (process.env.NODE_ENV === 'development') {
      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'capacitor://localhost',
        'ionic://localhost',
      ]
    }
    // In production, be restrictive
    return []
  }

  const origins = envOrigins.split(',').map((origin) => origin.trim())

  // Always include mobile app origins if not already present
  const mobileOrigins = ['capacitor://localhost', 'ionic://localhost']
  for (const mobileOrigin of mobileOrigins) {
    if (!origins.includes(mobileOrigin)) {
      origins.push(mobileOrigin)
    }
  }

  return origins
}

/**
 * Get CORS headers for a request
 */
export function getCORSHeaders(request?: NextRequest): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()
  const origin = request?.headers.get('origin') || ''

  // Check if the origin is allowed
  const allowOrigin =
    allowedOrigins.length === 0
      ? '*' // If no origins configured, allow all (backward compatibility)
      : allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0] || 'null' // Default to first allowed origin or 'null' if none

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}
