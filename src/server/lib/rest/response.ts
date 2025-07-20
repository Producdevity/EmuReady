import { NextResponse } from 'next/server'
import { normalizeError } from './errors'

interface ApiSuccessResponse<T> {
  success: true
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  timestamp: string
  version: string
}

interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
  version: string
}

// type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create a successful API response
 */
export function apiResponse<T>(
  data: T,
  options?: {
    status?: number
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
  },
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    version: 'v1',
  }

  if (options?.pagination) {
    response.pagination = options.pagination
  }

  return NextResponse.json(response, {
    status: options?.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v1',
    },
  })
}

/**
 * Create an error API response
 */
export function apiError(error: unknown): NextResponse<ApiErrorResponse> {
  const apiError = normalizeError(error)

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
    },
    timestamp: new Date().toISOString(),
    version: 'v1',
  }

  return NextResponse.json(response, {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v1',
    },
  })
}

/**
 * Helper to extract pagination params from URL
 */
export function getPaginationParams(url: URL): { page: number; limit: number } {
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)

  // Validate and constrain values
  return {
    page: Math.max(1, isNaN(page) ? 1 : page),
    limit: Math.min(100, Math.max(1, isNaN(limit) ? 10 : limit)),
  }
}

/**
 * Helper to create paginated response
 */
export function paginatedResponse<T>(
  items: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  status?: number,
): NextResponse<ApiSuccessResponse<T[]>> {
  return apiResponse(items, {
    status,
    pagination: {
      ...pagination,
      pages: Math.ceil(pagination.total / pagination.limit),
    },
  })
}

/**
 * Helper for empty responses (like DELETE)
 */
export function emptyResponse(status = 204): NextResponse {
  return new NextResponse(null, {
    status,
    headers: {
      'X-API-Version': 'v1',
    },
  })
}

/**
 * CORS headers for REST API
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

/**
 * Handle OPTIONS requests for CORS
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
