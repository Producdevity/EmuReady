import { verifyToken } from '@clerk/backend'
import { auth } from '@clerk/nextjs/server'
import { initTRPC } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import superjson from 'superjson'
import { ZodError } from 'zod'
import analytics from '@/lib/analytics'
import { AppError } from '@/lib/errors'
import { prisma } from '@/server/db'
import { initializeNotificationService } from '@/server/notifications/init'
import { type Nullable } from '@/types/utils'
import { Role } from '@orm'

type User = {
  id: string
  email: string | null
  name: string | null
  role: Role
}

type Session = {
  user: User
}

type CreateMobileContextOptions = {
  session: Nullable<Session>
}

const createInnerMobileContext = (
  opts: CreateMobileContextOptions & { headers?: Headers },
) => {
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
export const createMobileTRPCContext = async (
  opts: CreateNextContextOptions,
) => {
  let session: Nullable<Session> = null
  let clerkUserId: string | null = null

  // Try web authentication first (for development/testing)
  try {
    const webAuth = await auth()
    clerkUserId = webAuth.userId
  } catch (error) {
    console.error('Web auth failed, try mobile JWT token', error)
  }

  // If no web auth, try mobile JWT token from Authorization header
  if (!clerkUserId) {
    const authHeader = opts.req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        })
        clerkUserId = payload.sub
      } catch (error) {
        // Invalid or expired token - continue without auth for public endpoints
        if (process.env.NODE_ENV === 'development') {
          console.warn('Mobile JWT token verification failed:', error)
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
        },
      })

      if (user) {
        session = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        }
      } else {
        // User isn't found in the database
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `🔧 Mobile Dev: User with clerkId ${clerkUserId} not found in database.`,
          )
          console.warn(
            '   Run the seeder (npx prisma db seed) or set up webhooks for auto-sync.',
          )
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
export const createMobileTRPCFetchContext = async (
  opts: FetchCreateContextFnOptions,
) => {
  let session: Nullable<Session> = null
  let clerkUserId: string | null = null

  // Try mobile JWT token from Authorization header
  const authHeader = opts.req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token) {
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })
      clerkUserId = payload.sub
    } catch (error) {
      // Invalid or expired token - continue without auth for public endpoints
      if (process.env.NODE_ENV === 'development') {
        console.warn('Mobile JWT token verification failed:', error)
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
        },
      })

      if (user) {
        session = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        }
      } else {
        // User not found in database
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `🔧 Mobile Dev: User with clerkId ${clerkUserId} not found in database.`,
          )
          console.warn(
            '   Run the seeder (npx prisma db seed) or set up webhooks for auto-sync.',
          )
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
        zodError:
          ctx.error.cause instanceof ZodError
            ? ctx.error.cause.flatten()
            : null,
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
export const mobilePublicProcedure = mt.procedure.use(
  mobilePerformanceMiddleware,
)

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

    if (
      ctx.session.user.role !== Role.ADMIN &&
      ctx.session.user.role !== Role.SUPER_ADMIN
    ) {
      AppError.insufficientPermissions(Role.ADMIN)
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
      AppError.insufficientPermissions(Role.MODERATOR)
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })
