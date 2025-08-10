import { verifyToken } from '@clerk/backend'
import { auth } from '@clerk/nextjs/server'
import { initTRPC } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import superjson from 'superjson'
import { ZodError } from 'zod'
import analytics from '@/lib/analytics'
import { AppError } from '@/lib/errors'
import { log } from '@/lib/logger'
import { prisma } from '@/server/db'
import { initializeNotificationService } from '@/server/notifications/init'
import { hasDeveloperAccessToEmulator } from '@/server/utils/permissions'
import { type Nullable } from '@/types/utils'
import { hasPermissionInContext, PERMISSIONS } from '@/utils/permission-system'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'

// ===== Mobile Permission Procedure Shortcuts =====

type User = {
  id: string
  email: string | null
  name: string | null
  role: Role
  permissions: string[] // Array of permission keys
  showNsfw: boolean
}

type Session = {
  user: User
}

type CreateMobileContextOptions = {
  session: Nullable<Session>
}

const createInnerMobileContext = (opts: CreateMobileContextOptions & { headers?: Headers }) => {
  return {
    session: opts.session,
    prisma,
    headers: opts.headers,
  }
}

/**
 * Creates tRPC context for mobile requests
 * Handles both web sessions (via cookies) and mobile JWT tokens (via Authorization header)
 */
export const createMobileTRPCContext = async (opts: CreateNextContextOptions) => {
  let session: Nullable<Session> = null
  let clerkUserId: string | null = null

  // Try web authentication first (for development/testing)
  try {
    const webAuth = await auth()
    clerkUserId = webAuth.userId
  } catch (error) {
    log.error('Web auth failed, try mobile JWT token', error)
  }

  // If no web auth, try mobile JWT token from Authorization header
  if (!clerkUserId) {
    const authHeader = opts.req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      try {
        // Check if we have the right secret key for the token type
        const secretKey = process.env.CLERK_SECRET_KEY!

        // Log key type mismatch in production
        if (process.env.NODE_ENV === 'production') {
          const isTestKey = secretKey.startsWith('sk_test_')

          // JWT tokens from live keys have different signatures than test keys
          if (isTestKey) {
            console.warn('Warning: Using test secret key in production environment')
          }
        }

        // Verify token with options optimized for mobile apps
        const payload = await verifyToken(token, {
          secretKey,
          // Skip authorized parties check for mobile tokens (they often don't have azp claim)
          skipJwksCache: false,
          // Add clock skew tolerance for mobile devices with incorrect time
          clockSkewInMs: 60000, // 60 seconds tolerance
        })
        clerkUserId = payload.sub
      } catch (error) {
        // Invalid or expired token - continue without auth for public endpoints
        if (process.env.NODE_ENV === 'development') {
          console.warn('Mobile JWT token verification failed:', error)
        }
        // Log production errors for debugging
        if (process.env.NODE_ENV === 'production' && error instanceof Error) {
          console.error('Mobile auth error:', error.message)
          // Check for common issues
          if (error.message.includes('signature')) {
            console.error(
              'Token signature mismatch - check if CLERK_SECRET_KEY matches the token environment (live vs test)',
            )
          }
        }
      }
    }
  }

  // If we have a Clerk user ID, fetch user from the database
  if (clerkUserId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          showNsfw: true,
        },
      })

      if (user) {
        // Fetch user permissions based on their role
        const rolePermissions = await prisma.rolePermission.findMany({
          where: { role: user.role },
          include: { permission: { select: { key: true } } },
        })

        const permissions = rolePermissions.map((rp) => rp.permission.key)

        session = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions,
            showNsfw: user.showNsfw,
          },
        }
      } else {
        // User isn't found in the database
        if (process.env.NODE_ENV === 'development') {
          console.warn(`🔧 Mobile Dev: User with clerkId ${clerkUserId} not found in database.`)
          console.warn('   Run the seeder (npx prisma db seed) or set up webhooks for auto-sync.')
        } else {
          console.warn(
            `Mobile: User with clerkId ${clerkUserId} not found in database. Check webhook configuration.`,
          )
        }
      }
    } catch (dbError) {
      console.error('Database error in mobile context:', dbError)
    }
  }

  // Initialize notification service
  initializeNotificationService()

  return createInnerMobileContext({
    session,
    headers: new Headers(opts.req.headers as Record<string, string>),
  })
}

/**
 * Creates tRPC context for mobile fetch requests (used by the fetch adapter)
 */
export const createMobileTRPCFetchContext = async (opts: FetchCreateContextFnOptions) => {
  console.log('[Mobile Context] Creating mobile tRPC context for:', opts.req.url)
  let session: Nullable<Session> = null
  let clerkUserId: string | null = null

  // Debug: Log all headers to understand what's arriving
  const allHeaders: Record<string, string> = {}
  opts.req.headers.forEach((value: string, key: string) => {
    allHeaders[key] = value.substring(0, 50) // Truncate for security
  })
  console.log('[Mobile Context] ALL headers:', JSON.stringify(allHeaders))

  // Try mobile JWT token from Authorization header (check both cases)
  // Also check for custom header as fallback if Authorization is stripped
  const authHeader =
    opts.req.headers.get('authorization') ||
    opts.req.headers.get('Authorization') ||
    opts.req.headers.get('x-auth-token')
  const token = authHeader?.replace('Bearer ', '')

  console.log('[Mobile Context] Parsed headers:', {
    hasAuth: !!token,
    authHeaderFound: !!authHeader,
    headerUsed: authHeader
      ? authHeader === opts.req.headers.get('x-auth-token')
        ? 'x-auth-token'
        : 'Authorization'
      : 'none',
  })

  if (token) {
    try {
      // Check if we have the right secret key for the token type
      const secretKey = process.env.CLERK_SECRET_KEY!

      // Log key type mismatch in production
      if (process.env.NODE_ENV === 'production') {
        const isTestKey = secretKey.startsWith('sk_test_')

        // JWT tokens from live keys have different signatures than test keys
        if (isTestKey) {
          console.warn('Warning: Using test secret key in production environment')
        }
      }

      // Verify token with options optimized for mobile apps
      const payload = await verifyToken(token, {
        secretKey,
        // Skip authorized parties check for mobile tokens (they often don't have azp claim)
        skipJwksCache: false,
        // Add clock skew tolerance for mobile devices with incorrect time
        clockSkewInMs: 60000, // 60 seconds tolerance
      })
      clerkUserId = payload.sub
      console.log('[Mobile Context] Token verification successful, userId:', clerkUserId)
    } catch (error) {
      // Invalid or expired token - continue without auth for public endpoints
      if (process.env.NODE_ENV === 'development') {
        console.warn('Mobile JWT token verification failed:', error)
      }
      // Log production errors for debugging
      if (process.env.NODE_ENV === 'production' && error instanceof Error) {
        console.error('Mobile auth error:', error.message)
        // Check for common issues
        if (error.message.includes('signature')) {
          console.error(
            'Token signature mismatch - check if CLERK_SECRET_KEY matches the token environment (live vs test)',
          )
        }
      }
    }
  }

  // If we have a Clerk user ID, fetch user from database
  if (clerkUserId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          showNsfw: true,
        },
      })

      if (user) {
        // Fetch user permissions based on their role
        const rolePermissions = await prisma.rolePermission.findMany({
          where: { role: user.role },
          include: { permission: { select: { key: true } } },
        })

        const permissions = rolePermissions.map((rp) => rp.permission.key)

        session = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions,
            showNsfw: user.showNsfw,
          },
        }
      } else {
        // User not found in database
        if (process.env.NODE_ENV === 'development') {
          console.warn(`🔧 Mobile Dev: User with clerkId ${clerkUserId} not found in database.`)
          console.warn('   Run the seeder (npx prisma db seed) or set up webhooks for auto-sync.')
        } else {
          console.warn(
            `Mobile: User with clerkId ${clerkUserId} not found in database. Check webhook configuration.`,
          )
        }
      }
    } catch (dbError) {
      console.error('Database error in mobile context:', dbError)
    }
  }

  // Initialize notification service
  initializeNotificationService()

  return createInnerMobileContext({
    session,
    headers: opts.req.headers,
  })
}

export type MobileTRPCContext = ReturnType<typeof createInnerMobileContext>

const mt = initTRPC.context<typeof createMobileTRPCFetchContext>().create({
  transformer: superjson,
  errorFormatter(ctx) {
    // Track errors for analytics
    if (ctx.error.code !== 'UNAUTHORIZED' && ctx.error.code !== 'FORBIDDEN') {
      analytics.performance.errorOccurred({
        errorType: ctx.error.code || 'UNKNOWN',
        errorMessage: ctx.error.message,
        page: `mobile.${ctx.path || 'unknown'}`,
      })
    }

    return {
      ...ctx.shape,
      data: {
        ...ctx.shape.data,
        zodError: ctx.error.cause instanceof ZodError ? ctx.error.cause.flatten() : null,
      },
    }
  },
})

export const createMobileTRPCRouter = mt.router

/**
 * Middleware to track slow queries for mobile
 */
const mobilePerformanceMiddleware = mt.middleware(async ({ next, path }) => {
  const start = Date.now()
  const result = await next()
  const duration = Date.now() - start

  // Track slow queries (threshold: 3 seconds for mobile)
  const THRESHOLD_MS = 3000
  if (duration > THRESHOLD_MS) {
    analytics.performance.slowQuery({
      queryName: `mobile.${path || 'unknown'}`,
      duration,
      threshold: THRESHOLD_MS,
    })
  }

  return result
})

/**
 * Public mobile procedure (no auth required)
 */
export const mobilePublicProcedure = mt.procedure.use(mobilePerformanceMiddleware)

/**
 * Protected mobile procedure (requires authentication)
 */
export const mobileProtectedProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) AppError.unauthorized()

    return next({
      ctx: { session: { ...ctx.session, user: ctx.session.user } },
    })
  })

/**
 * Mobile admin procedure (requires admin role)
 */
export const mobileAdminProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      AppError.unauthorized()
    }

    if (ctx.session.user.role !== Role.ADMIN && ctx.session.user.role !== Role.SUPER_ADMIN) {
      AppError.insufficientRole(Role.ADMIN)
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })

/**
 * Mobile moderator procedure (requires moderator role or higher)
 */
export const mobileModeratorProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      AppError.unauthorized()
    }

    const allowedRoles: Role[] = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN]
    if (!allowedRoles.includes(ctx.session.user.role)) {
      AppError.insufficientRole(Role.MODERATOR)
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })

/**
 * Mobile author procedure (requires at least Author role)
 */
export const mobileAuthorProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) return AppError.unauthorized()

    // For now, we consider User as Author
    if (!hasPermission(ctx.session.user.role, Role.USER)) {
      AppError.forbidden()
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })

/**
 * Mobile developer procedure (requires Developer role)
 */
export const mobileDeveloperProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      AppError.unauthorized()
    }

    if (!hasPermission(ctx.session.user.role, Role.DEVELOPER)) {
      AppError.insufficientRole(Role.DEVELOPER)
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })

/**
 * Mobile super admin procedure (requires SUPER_ADMIN role)
 */
export const mobileSuperAdminProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) return AppError.unauthorized()

    if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
      AppError.insufficientRole(Role.SUPER_ADMIN)
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })

/**
 * Mobile developer emulator procedure
 * Ensures that a developer can only access emulators they're verified for,
 * while admins and super admins retain access to all emulators.
 *
 * @param emulatorId The ID of the emulator to check access for
 * @returns A procedure that can be used to create router endpoints requiring emulator-specific access
 */
export function mobileDeveloperEmulatorProcedure(emulatorId: string) {
  return mobileProtectedProcedure.use(async ({ ctx, next }) => {
    const userId = ctx.session.user.id

    const hasAccess = await hasDeveloperAccessToEmulator(userId, emulatorId, ctx.prisma)

    if (!hasAccess) return AppError.insufficientRole(Role.DEVELOPER)

    return next({ ctx: { ...ctx, emulatorId } })
  })
}

// ===== Permission-Based Procedures =====

/**
 * Generic mobile permission-based procedure
 * @param requiredPermission The permission key required to access this procedure
 */
export function mobilePermissionProcedure(requiredPermission: string) {
  return mobileProtectedProcedure.use(({ ctx, next }) => {
    if (!hasPermissionInContext(ctx, requiredPermission)) {
      return AppError.insufficientPermissions(requiredPermission)
    }

    return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
  })
}

/**
 * Mobile procedure that requires multiple permissions (all must be present)
 * @param requiredPermissions Array of permission keys that are all required
 */
export function mobileMultiPermissionProcedure(requiredPermissions: string[]) {
  return mobileProtectedProcedure.use(({ ctx, next }) => {
    const missingPermissions = requiredPermissions.filter(
      (permission) => !hasPermissionInContext(ctx, permission),
    )

    if (missingPermissions.length > 0) return AppError.insufficientPermissions(missingPermissions)

    return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
  })
}

/**
 * Mobile procedure that requires any one of multiple permissions
 * @param requiredPermissions Array of permission keys (any one is sufficient)
 */
export function mobileAnyPermissionProcedure(requiredPermissions: string[]) {
  return mobileProtectedProcedure.use(({ ctx, next }) => {
    const hasAnyPermission = requiredPermissions.some((permission) =>
      hasPermissionInContext(ctx, permission),
    )

    if (!hasAnyPermission) return AppError.insufficientRoles(requiredPermissions)

    return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
  })
}

export const mobileCreateListingProcedure = mobilePermissionProcedure(PERMISSIONS.CREATE_LISTING)
export const mobileApproveListingsProcedure = mobilePermissionProcedure(
  PERMISSIONS.APPROVE_LISTINGS,
)
export const mobileManageUsersProcedure = mobilePermissionProcedure(PERMISSIONS.MANAGE_USERS)
export const mobileManagePermissionsProcedure = mobilePermissionProcedure(
  PERMISSIONS.MANAGE_PERMISSIONS,
)
export const mobileAccessAdminPanelProcedure = mobilePermissionProcedure(
  PERMISSIONS.ACCESS_ADMIN_PANEL,
)
export const mobileViewStatisticsProcedure = mobilePermissionProcedure(PERMISSIONS.VIEW_STATISTICS)
export const mobileManageEmulatorsProcedure = mobilePermissionProcedure(
  PERMISSIONS.MANAGE_EMULATORS,
)
export const mobileEditGamesProcedure = mobilePermissionProcedure(PERMISSIONS.EDIT_GAMES)
export const mobileDeleteGamesProcedure = mobilePermissionProcedure(PERMISSIONS.DELETE_GAMES)
export const mobileManageGamesProcedure = mobilePermissionProcedure(PERMISSIONS.MANAGE_GAMES)
export const mobileApproveGamesProcedure = mobilePermissionProcedure(PERMISSIONS.APPROVE_GAMES)
export const mobileManageDevicesProcedure = mobilePermissionProcedure(PERMISSIONS.MANAGE_DEVICES)
export const mobileManageSystemsProcedure = mobilePermissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
