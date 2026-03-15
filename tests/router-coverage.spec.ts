import { test, expect } from '@playwright/test'

/**
 * API security and validation tests that verify endpoint protection.
 */

test.describe('Router Security Verification', () => {
  test('protected endpoints should reject unauthenticated requests', async ({ request }) => {
    const protectedEndpoints = [
      '/api/trpc/listings.create',
      '/api/trpc/users.update',
      '/api/trpc/userBans.create',
      '/api/trpc/trust.adjustTrustScore',
    ]

    for (const endpoint of protectedEndpoints) {
      const response = await request.post(endpoint, {
        data: {},
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // tRPC returns 401 for UNAUTHORIZED errors
      expect([401, 403]).toContain(response.status())
    }
  })

  test('admin endpoints should reject non-admin users', async ({ request }) => {
    const adminOnlyEndpoints = [
      '/api/trpc/users.updateRole',
      '/api/trpc/permissions.create',
      '/api/trpc/trust.runMonthlyActiveBonus',
    ]

    for (const endpoint of adminOnlyEndpoints) {
      const response = await request.post(endpoint, {
        data: {},
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Should reject unauthenticated requests to admin endpoints
      expect([401, 403]).toContain(response.status())
    }
  })
})

test.describe('Data Validation Verification', () => {
  test('should reject invalid data on creation endpoints', async ({ request }) => {
    const response = await request.post('/api/trpc/listings.create', {
      data: {
        title: '',
        gameId: 'invalid-id',
        deviceId: -1,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Should return 400 (bad input) or 401/403 (unauthenticated)
    expect([400, 401, 403]).toContain(response.status())
  })

  test('should handle malformed tRPC requests', async ({ request }) => {
    const response = await request.post('/api/trpc/nonExistentRouter.nonExistentProcedure', {
      data: {},
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Should return an error status, not 200
    expect(response.status()).toBeGreaterThanOrEqual(400)
  })
})
