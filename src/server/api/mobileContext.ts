import { verifyToken } from '@clerk/backend'
import { auth } from '@clerk/nextjs/server'
import { initTRPC } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import superjson from 'superjson'
import { ZodError } from 'zod'
import analytics from '@/lib/analytics'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { prisma } from '@/server/db'
import { ApiAccessService } from '@/server/services/api-access.service'
import { hasDeveloperAccessToEmulator } from '@/server/utils/permissions'
import { type Nullable } from '@/types/utils'
import { hasPermissionInContext, PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import type { ApiKeyWithUser } from '@/server/repositories/api-keys.repository'

// ===== Mobile Permission Procedure Shortcuts =====

type User = {
  id: string
  email: string | null
  name: string | null
  role: Role
  permissions: string[]
  showNsfw: boolean
}

type Session = {
  user: User
}

type CreateMobileContextOptions = {
  session: Nullable<Session>
  apiKey?: ApiKeyWithUser | null
}

const createInnerMobileContext = (opts: CreateMobileContextOptions & { headers?: Headers }) => {
  return {
    session: opts.session,
    prisma,
    headers: opts.headers,
    apiKey: opts.apiKey ?? null,
  }
}

async function getPermissionsForRole(role: Role): Promise<string[]> {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: { select: { key: true } } },
  })

  return rolePermissions.map((rp) => rp.permission.key)
}

async function createSessionForUserId(userId: string): Promise<Nullable<Session>> {
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      showNsfw: true,
    },
  })

  if (!user) return null

  const permissions = await getPermissionsForRole(user.role)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
      showNsfw: user.showNsfw,
    },
  }
}

async function createSessionFromApiKey(apiKey: ApiKeyWithUser): Promise<Nullable<Session>> {
  const permissions = await getPermissionsForRole(apiKey.user.role)

  return {
    user: {
      id: apiKey.user.id,
      email: apiKey.user.email,
      name: apiKey.user.name,
      role: apiKey.user.role,
      permissions,
      showNsfw: apiKey.user.showNsfw,
    },
  }
}

function extractApiKey(headers: Headers): string | null {
  const headerCandidates = [headers.get('x-api-key'), headers.get('X-API-Key')]
  for (const candidate of headerCandidates) {
    if (candidate && candidate.trim()) return candidate.trim()
  }

  const authorization = headers.get('authorization') || headers.get('Authorization')
  if (authorization && authorization.startsWith('ApiKey ')) {
    return authorization.slice('ApiKey '.length).trim()
  }

  return null
}

async function resolveApiKey(headers: Headers): Promise<ApiKeyWithUser | null> {
  const rawKey = extractApiKey(headers)
  if (!rawKey) return null

  const apiAccessService = new ApiAccessService(prisma)
  return apiAccessService.authorize(rawKey)
}

async function resolveClerkSessionFromHeaders(headers: Headers): Promise<string | null> {
  const authHeader = headers.get('authorization') || headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  if (!token) return null

  try {
    const secretKey = process.env.CLERK_SECRET_KEY!

    if (process.env.NODE_ENV === 'production' && secretKey.startsWith('sk_test_')) {
      console.warn('Warning: Using test secret key in production environment')
    }

    const payload = await verifyToken(token, {
      secretKey,
      skipJwksCache: false,
      clockSkewInMs: 60000,
    })

    return payload.sub
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Mobile JWT token verification failed:', error)
    }

    if (process.env.NODE_ENV === 'production' && error instanceof Error) {
      console.error('Mobile auth error:', error.message)
      if (error.message.includes('signature')) {
        console.error(
          'Token signature mismatch - check if CLERK_SECRET_KEY matches the token environment (live vs test)',
        )
      }
    }
  }

  return null
}

/**
 * Creates tRPC context for mobile requests
 * Handles both web sessions (via cookies) and mobile JWT tokens (via Authorization header)
 */
export const createMobileTRPCContext = async (opts: CreateNextContextOptions) => {
  const headers = new Headers(opts.req.headers as Record<string, string>)

  let session: Nullable<Session> = null
  let clerkUserId: string | null = null

  try {
    const webAuth = await auth()
    clerkUserId = webAuth.userId
  } catch (error) {
    logger.error('Web auth failed, try mobile JWT token', error)
  }

  if (!clerkUserId) {
    clerkUserId = await resolveClerkSessionFromHeaders(headers)
  }

  const authorizedApiKey = await resolveApiKey(headers)
  if (authorizedApiKey) {
    session = await createSessionFromApiKey(authorizedApiKey)
  }

  if (!session && clerkUserId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    })

    if (user) {
      session = await createSessionForUserId(user.id)
    }
  }

  return createInnerMobileContext({
    session,
    headers,
    apiKey: authorizedApiKey,
  })
}

/**
 * Creates tRPC context for mobile fetch requests (used by the fetch adapter)
 */
export const createMobileTRPCFetchContext = async (opts: FetchCreateContextFnOptions) => {
  const headers = opts.req.headers

  let session: Nullable<Session> = null
  const clerkUserId = await resolveClerkSessionFromHeaders(headers)

  const authorizedApiKey = await resolveApiKey(headers)
  if (authorizedApiKey) {
    session = await createSessionFromApiKey(authorizedApiKey)
  }

  if (!session && clerkUserId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    })

    if (user) {
      session = await createSessionForUserId(user.id)
    }
  }

  return createInnerMobileContext({
    session,
    headers,
    apiKey: authorizedApiKey,
  })
}

export type MobileTRPCContext = ReturnType<typeof createInnerMobileContext>

const mt = initTRPC.context<typeof createMobileTRPCFetchContext>().create({
  transformer: superjson,
  errorFormatter(ctx) {
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

const mobileRateLimitMiddleware = mt.middleware(async ({ ctx, next }) => {
  if (ctx.apiKey) {
    const apiAccessService = new ApiAccessService(ctx.prisma)
    await apiAccessService.consumeRequest(ctx.apiKey)
  }

  return next()
})

/**
 * Public mobile procedure (no auth required)
 */
export const mobilePublicProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(mobileRateLimitMiddleware)

/**
 * Protected mobile procedure (requires authentication)
 */
export const mobileProtectedProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(mobileRateLimitMiddleware)
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
  .use(mobileRateLimitMiddleware)
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

export const mobileModeratorProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(mobileRateLimitMiddleware)
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

export const mobileAuthorProcedure = mt.procedure
  .use(mobilePerformanceMiddleware)
  .use(mobileRateLimitMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) return AppError.unauthorized()

    if (!hasRolePermission(ctx.session.user.role, Role.USER)) {
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
  .use(mobileRateLimitMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      AppError.unauthorized()
    }

    if (!hasRolePermission(ctx.session.user.role, Role.DEVELOPER)) {
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
  .use(mobileRateLimitMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) return AppError.unauthorized()

    if (!hasRolePermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
      AppError.insufficientRole(Role.SUPER_ADMIN)
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })

export function mobileDeveloperEmulatorProcedure(emulatorId: string) {
  return mobileProtectedProcedure.use(async ({ ctx, next }) => {
    const userId = ctx.session.user.id

    const hasAccess = await hasDeveloperAccessToEmulator(userId, emulatorId, ctx.prisma)

    if (!hasAccess) return AppError.insufficientRole(Role.DEVELOPER)

    return next({ ctx: { ...ctx, emulatorId } })
  })
}

export function mobilePermissionProcedure(requiredPermission: string) {
  return mobileProtectedProcedure.use(({ ctx, next }) => {
    return hasPermissionInContext(ctx, requiredPermission)
      ? next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
      : AppError.insufficientPermissions(requiredPermission)
  })
}

export function mobileMultiPermissionProcedure(requiredPermissions: string[]) {
  return mobileProtectedProcedure.use(({ ctx, next }) => {
    const missingPermissions = requiredPermissions.filter(
      (permission) => !hasPermissionInContext(ctx, permission),
    )

    if (missingPermissions.length > 0) return AppError.insufficientPermissions(missingPermissions)

    return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
  })
}

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
