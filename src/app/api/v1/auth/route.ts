import { apiResponse, handleOptions } from '@/server/lib/rest/response'

// Handle CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

/**
 * GET /api/v1/auth
 * Authentication information and instructions
 */
export async function GET() {
  return apiResponse({
    message: 'EmuReady uses Clerk for authentication',
    instructions: {
      web: "Use Clerk's React components or SDK for web authentication",
      mobile: {
        step1: 'Use Clerk SDK to authenticate users in your mobile app',
        step2: 'Get the JWT token from Clerk after successful authentication',
        step3:
          'Include the JWT token in the Authorization header: Bearer YOUR_JWT_TOKEN',
        step4: 'The token will be verified on all protected endpoints',
      },
    },
    endpoints: {
      'GET /auth/me': 'Get current authenticated user (requires JWT)',
      'GET /users/:id': 'Get user profile by ID',
      'PUT /users/:id': 'Update user profile (owner only)',
    },
    clerkUrls: {
      documentation: 'https://clerk.com/docs',
      signUp: 'https://api.clerk.com/v1/sign_ups',
      signIn: 'https://api.clerk.com/v1/sign_ins',
    },
  })
}

export const runtime = 'edge'
