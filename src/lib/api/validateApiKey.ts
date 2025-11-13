import { AppError, ResourceError } from '@/lib/errors'
import { prisma } from '@/server/db'
import { ApiAccessService } from '@/server/services/api-access.service'
import type { ApiKeyWithUser } from '@/server/repositories/api-keys.repository'
import type { NextRequest } from 'next/server'

/**
 * Extracts API key from request headers
 * Supports both x-api-key header and Authorization: ApiKey format
 */
export function extractApiKeyFromRequest(request: NextRequest): string | null {
  const xApiKey = request.headers.get('x-api-key')
  if (xApiKey) return xApiKey.trim()

  const authorization = request.headers.get('authorization')
  if (authorization && authorization.startsWith('ApiKey ')) {
    return authorization.slice('ApiKey '.length).trim()
  }

  return null
}

/**
 * Validates API key and enforces quota limits
 * Throws AppError if validation or quota check fails
 *
 * @returns Validated API key with user information
 */
export async function validateAndConsumeApiKey(request: NextRequest): Promise<ApiKeyWithUser> {
  const rawKey = extractApiKeyFromRequest(request)

  if (!rawKey) {
    throw AppError.unauthorized(
      'API key required. Provide via x-api-key header or Authorization: ApiKey header',
    )
  }

  const apiAccessService = new ApiAccessService(prisma)
  const validatedKey = await apiAccessService.authorize(rawKey)

  if (!validatedKey) ResourceError.apiKey.invalid()

  await apiAccessService.consumeRequest(validatedKey!)
  return validatedKey!
}
