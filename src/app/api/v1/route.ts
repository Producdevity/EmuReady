import { type NextRequest } from 'next/server'
import { apiResponse, handleOptions } from '@/server/lib/rest/response'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1
 * API documentation and available endpoints
 */
export async function GET(request: NextRequest) {
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`

  const documentation = {
    name: 'EmuReady REST API',
    version: 'v1',
    description:
      'RESTful API for EmuReady mobile app and external integrations',
    baseUrl: `${baseUrl}/api/v1`,
    authentication: {
      type: 'Bearer',
      description: 'Use Clerk JWT token in Authorization header',
      example: 'Authorization: Bearer YOUR_JWT_TOKEN',
    },
    endpoints: {
      listings: {
        'GET /listings': {
          description: 'Get paginated listings with filters',
          authentication: 'Optional',
          queryParams: {
            page: 'number (default: 1)',
            limit: 'number (default: 10, max: 100)',
            search: 'string',
            gameId: 'UUID',
            systemId: 'UUID',
            emulatorId: 'UUID',
            emulatorIds: 'comma-separated UUIDs',
            deviceId: 'UUID',
            deviceIds: 'comma-separated UUIDs',
            socId: 'UUID',
            socIds: 'comma-separated UUIDs',
            performanceId: 'UUID',
          },
        },
        'POST /listings': {
          description: 'Create a new listing',
          authentication: 'Required',
          body: {
            gameId: 'UUID (required)',
            deviceId: 'UUID (required)',
            emulatorId: 'UUID (required)',
            performanceId: 'UUID (required)',
            notes: 'string (optional)',
            customFieldValues: 'object (optional)',
          },
        },
        'GET /listings/:id': {
          description: 'Get a single listing',
          authentication: 'Optional',
        },
        'PUT /listings/:id': {
          description: 'Update a listing',
          authentication: 'Required (owner only)',
          body: {
            performanceId: 'UUID (optional)',
            notes: 'string (optional)',
            customFieldValues: 'object (optional)',
          },
        },
        'DELETE /listings/:id': {
          description: 'Delete a listing',
          authentication: 'Required (owner or moderator)',
        },
        'GET /listings/featured': {
          description: 'Get featured listings (highest voted)',
          authentication: 'Optional',
        },
        'GET /listings/by-game/:gameId': {
          description: 'Get all listings for a specific game',
          authentication: 'Optional',
        },
      },
      games: {
        'GET /games': {
          description: 'Get paginated games with filters',
          authentication: 'Optional',
          queryParams: {
            page: 'number (default: 1)',
            limit: 'number (default: 10, max: 100)',
            search: 'string',
            systemId: 'UUID',
          },
        },
        'GET /games/:id': {
          description: 'Get a single game',
          authentication: 'Optional',
        },
        'GET /games/search': {
          description: 'Search games by title',
          authentication: 'Optional',
          queryParams: {
            q: 'string (required)',
            limit: 'number (default: 20, max: 50)',
          },
        },
      },
      devices: {
        'GET /devices': {
          description: 'Get paginated devices',
          authentication: 'None',
          queryParams: {
            page: 'number (default: 1)',
            limit: 'number (default: 10, max: 100)',
            search: 'string',
          },
        },
        'GET /devices/:id': {
          description: 'Get a single device',
          authentication: 'None',
        },
        'GET /device-brands': {
          description: 'Get all device brands',
          authentication: 'None',
        },
      },
      emulators: {
        'GET /emulators': {
          description: 'Get paginated emulators',
          authentication: 'None',
          queryParams: {
            page: 'number (default: 1)',
            limit: 'number (default: 10, max: 100)',
            search: 'string',
          },
        },
        'GET /emulators/:id': {
          description: 'Get a single emulator with custom fields',
          authentication: 'None',
        },
      },
      systems: {
        'GET /systems': {
          description: 'Get all gaming systems/consoles',
          authentication: 'None',
        },
      },
      votes: {
        'POST /listings/:id/vote': {
          description: 'Vote on a listing',
          authentication: 'Required',
          body: {
            value: 'boolean (required)',
          },
        },
        'GET /listings/:id/vote': {
          description: 'Get user vote on a listing',
          authentication: 'Required',
        },
      },
      comments: {
        'GET /listings/:id/comments': {
          description: 'Get comments for a listing',
          authentication: 'Optional',
          queryParams: {
            page: 'number (default: 1)',
            limit: 'number (default: 10)',
          },
        },
        'POST /listings/:id/comments': {
          description: 'Create a comment',
          authentication: 'Required',
          body: {
            content: 'string (required, max: 1000)',
          },
        },
        'PUT /comments/:id': {
          description: 'Update a comment',
          authentication: 'Required (owner only)',
          body: {
            content: 'string (required, max: 1000)',
          },
        },
        'DELETE /comments/:id': {
          description: 'Delete a comment',
          authentication: 'Required (owner or moderator)',
        },
      },
      auth: {
        'GET /auth': {
          description:
            'Authentication information and Clerk integration details',
          authentication: 'None',
        },
        'GET /auth/me': {
          description: 'Get current authenticated user',
          authentication: 'Required',
        },
      },
      users: {
        'GET /users/:id': {
          description: 'Get user profile by ID',
          authentication: 'None',
        },
        'PUT /users/:id': {
          description: 'Update user profile',
          authentication: 'Required (owner or admin)',
          body: {
            name: 'string (optional)',
            showNsfw: 'boolean (optional)',
            profileImage: 'string URL (optional)',
          },
        },
      },
    },
    responseFormat: {
      success: {
        success: true,
        data: 'T',
        pagination: '{ page, limit, total, pages } (optional)',
        timestamp: 'ISO 8601',
        version: 'string',
      },
      error: {
        success: false,
        error: {
          code: 'string',
          message: 'string',
          details: 'any (optional)',
        },
        timestamp: 'ISO 8601',
        version: 'string',
      },
    },
    errorCodes: {
      VALIDATION_ERROR: '400 - Invalid request parameters',
      UNAUTHORIZED: '401 - Authentication required',
      FORBIDDEN: '403 - Insufficient permissions',
      NOT_FOUND: '404 - Resource not found',
      CONFLICT: '409 - Resource already exists',
      INTERNAL_ERROR: '500 - Server error',
    },
  }

  return apiResponse(documentation)
}

export const runtime = 'edge'
