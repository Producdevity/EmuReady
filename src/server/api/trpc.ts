import { auth } from '@clerk/nextjs/server'
import { initTRPC } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import superjson from 'superjson'
import { ZodError } from 'zod'
import analytics from '@/lib/analytics'
import { AppError } from '@/lib/errors'
import { prisma } from '@/server/db'
import { hasDeveloperAccessToEmulator } from '@/server/utils/permissions'
import { type Nullable } from '@/types/utils'
import { hasPermissionInContext, PERMISSIONS } from '@/utils/permission-system'
import { hasPermission } from '@/utils/permissions'
import { Role } from '@orm'

type User = {
  id: string
  email: string | null
  name: string | null
  role: Role
  permissions: string[] // permission keys
  showNsfw: boolean
}

type Session = {
  user: User
}

type CreateContextOptions = {
  session: Nullable<Session>
}

const createInnerTRPCContext = (opts: CreateContextOptions & { headers?: Headers }) => {
  return { prisma, session: opts.session, headers: opts.headers }
}

/**
 * Creates a session from a Clerk user ID, with auto-creation fallback
 */
async function createSessionFromClerkUserId(userId: string): Promise<Nullable<Session>> {
  // Find user in database - they should exist due to webhook sync
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, name: true, role: true, showNsfw: true },
  })

  // If the user doesn't exist, create them automatically
  // This handles cases where webhooks aren't configured or during development
  if (!user) {
    try {
      // Get user info from Clerk
      const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      })

      if (clerkUser.ok) {
        const clerkData = await clerkUser.json()
        const primaryEmail =
          clerkData.email_addresses?.find(
            (email: { id: string; email_address: string }) =>
              email.id === clerkData.primary_email_address_id,
          ) || clerkData.email_addresses?.[0]

        if (primaryEmail) {
          console.log(`🔧 Auto-creating user with clerkId ${userId} in database`)
          user = await prisma.user.create({
            data: {
              clerkId: userId,
              email: primaryEmail.email_address,
              name: clerkData.username || clerkData.first_name || null,
              profileImage: clerkData.image_url || null,
              role: Role.USER, // Default role
            },
            select: { id: true, email: true, name: true, role: true, showNsfw: true },
          })
        }
      }
    } catch (error) {
      console.error('Failed to auto-create user:', error)
    }

    // If we still don't have a user, show appropriate warning
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `🔧 Dev mode: User with clerkId ${userId} not found in database and auto-creation failed.`,
        )
        console.warn(
          '   Either run the seeder (npx prisma db seed) or set up webhooks for auto-sync.',
        )
      } else {
        console.warn(
          `User with clerkId ${userId} not found in database and auto-creation failed. Check webhook configuration.`,
        )
      }
    }
  }

  if (!user) return null

  // Fetch user permissions based on their role
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role: user.role },
    include: { permission: { select: { key: true } } },
  })

  const permissions = rolePermissions.map((rp) => rp.permission.key)

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

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { userId } = await auth()

  let session: Nullable<Session> = null

  if (userId) session = await createSessionFromClerkUserId(userId)

  return createInnerTRPCContext({
    session,
    headers: new Headers(opts.req.headers as Record<string, string>),
  })
}

/**
 * App Router version of context creation (for /api/trpc/[trpc]/route.ts)
 */
export const createAppRouterTRPCContext = async () => {
  const { userId } = await auth()

  let session: Nullable<Session> = null

  if (userId) session = await createSessionFromClerkUserId(userId)

  return {
    session,
    prisma,
    headers: new Headers(),
  }
}

export type TRPCContext = ReturnType<typeof createInnerTRPCContext>

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter(ctx) {
    // Track errors for analytics
    if (ctx.error.code !== 'UNAUTHORIZED' && ctx.error.code !== 'FORBIDDEN') {
      analytics.performance.errorOccurred({
        errorType: ctx.error.code || 'UNKNOWN',
        errorMessage: ctx.error.message,
        page: ctx.path || 'unknown',
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

export const createTRPCRouter = t.router

/**
 * Middleware to track slow queries
 */
const performanceMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()
  const result = await next()
  const duration = Date.now() - start

  // Track slow queries (threshold: 2 seconds)
  const THRESHOLD_MS = 2000
  if (duration > THRESHOLD_MS) {
    analytics.performance.slowQuery({
      queryName: path || 'unknown',
      duration,
      threshold: THRESHOLD_MS,
    })
  }

  return result
})

/**
 * Public (unauthed) procedure
 */
export const publicProcedure = t.procedure.use(performanceMiddleware)

/**
 * Middleware to check if a user is signed in
 */
export const protectedProcedure = t.procedure.use(performanceMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) AppError.unauthorized()

  return next({
    ctx: { session: { ...ctx.session, user: ctx.session.user } },
  })
})

/**
 * Middleware to check if a user has at least Author role
 */
export const authorProcedure = t.procedure.use(performanceMiddleware).use(({ ctx, next }) => {
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
 * Middleware to check if a user has Moderator role
 * TODO: use implementation of this procedure
 */
export const moderatorProcedure = t.procedure.use(performanceMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    AppError.unauthorized()
  }

  if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
    AppError.insufficientRole(Role.MODERATOR)
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/**
 * Middleware to check if a user has Developer role
 */
export const developerProcedure = t.procedure.use(performanceMiddleware).use(({ ctx, next }) => {
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
 * Middleware to check if a user has Admin role
 */
export const adminProcedure = t.procedure.use(performanceMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) return AppError.unauthorized()

  if (!hasPermission(ctx.session.user.role, Role.ADMIN)) {
    AppError.insufficientRole(Role.ADMIN)
  }

  return next({
    ctx: { session: { ...ctx.session, user: ctx.session.user } },
  })
})

/**
 * Middleware to check if a user has SUPER_ADMIN role
 */
export const superAdminProcedure = t.procedure.use(performanceMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) return AppError.unauthorized()

  if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
    AppError.insufficientRole(Role.SUPER_ADMIN)
  }

  return next({
    ctx: { session: { ...ctx.session, user: ctx.session.user } },
  })
})

/**
 * Middleware to check if a developer has access to a specific emulator
 * This procedure ensures that a developer can only access emulators they're verified for,
 * while admins and super admins retain access to all emulators.
 *
 * @param emulatorId The ID of the emulator to check access for
 * @returns A procedure that can be used to create router endpoints requiring emulator-specific access
 * @throws {AppError} if the user does not have access to the emulator
 * TODO: use implementation of this procedure
 */
export function developerEmulatorProcedure(emulatorId: string) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const userId = ctx.session.user.id

    const hasAccess = await hasDeveloperAccessToEmulator(userId, emulatorId, ctx.prisma)

    if (!hasAccess) return AppError.insufficientRole(Role.DEVELOPER)

    return next({ ctx: { ...ctx, emulatorId } })
  })
}

// ===== Permission-Based Procedures =====

/**
 * Generic permission-based procedure
 * @param requiredPermission The permission key required to access this procedure
 */
export function permissionProcedure(requiredPermission: string) {
  return protectedProcedure.use(({ ctx, next }) => {
    return hasPermissionInContext(ctx, requiredPermission)
      ? next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
      : AppError.insufficientPermissions(requiredPermission)
  })
}

/**
 * Procedure that requires multiple permissions (all must be present)
 * @param requiredPermissions Array of permission keys that are all required
 * TODO: use implementation of this procedure
 */
export function multiPermissionProcedure(requiredPermissions: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    const missingPermissions = requiredPermissions.filter(
      (permission) => !hasPermissionInContext(ctx, permission),
    )

    if (missingPermissions.length > 0) return AppError.insufficientPermissions(missingPermissions)

    return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
  })
}

/**
 * Procedure that requires any one of multiple permissions
 * @param requiredPermissions Array of permission keys (any one is sufficient)
 * TODO: use implementation of this procedure
 */
export function anyPermissionProcedure(requiredPermissions: string[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    const hasAnyPermission = requiredPermissions.some((permission) =>
      hasPermissionInContext(ctx, permission),
    )

    if (!hasAnyPermission) return AppError.insufficientRoles(requiredPermissions)

    return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } })
  })
}

// Common permission-based procedures for convenience
export const createListingProcedure = permissionProcedure(PERMISSIONS.CREATE_LISTING)
export const approveListingsProcedure = permissionProcedure(PERMISSIONS.APPROVE_LISTINGS)

// TODO: use implementation of this procedure
export const manageUsersProcedure = permissionProcedure(PERMISSIONS.MANAGE_USERS)
export const viewUserBansProcedure = permissionProcedure(PERMISSIONS.VIEW_USER_BANS)
export const manageUserBansProcedure = permissionProcedure(PERMISSIONS.MANAGE_USER_BANS)
export const managePermissionsProcedure = permissionProcedure(PERMISSIONS.MANAGE_PERMISSIONS)
export const accessAdminPanelProcedure = permissionProcedure(PERMISSIONS.ACCESS_ADMIN_PANEL)
export const viewStatisticsProcedure = permissionProcedure(PERMISSIONS.VIEW_STATISTICS)
export const manageEmulatorsProcedure = permissionProcedure(PERMISSIONS.MANAGE_EMULATORS)
export const editGamesProcedure = permissionProcedure(PERMISSIONS.EDIT_GAMES)
export const deleteGamesProcedure = permissionProcedure(PERMISSIONS.DELETE_GAMES)

// TODO: use implementation of this procedure
export const manageGamesProcedure = permissionProcedure(PERMISSIONS.MANAGE_GAMES)
export const approveGamesProcedure = permissionProcedure(PERMISSIONS.APPROVE_GAMES)
export const manageDevicesProcedure = permissionProcedure(PERMISSIONS.MANAGE_DEVICES)

// TODO: use implementation of this procedure
export const manageSystemsProcedure = permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
export const deleteAnyListingProcedure = permissionProcedure(PERMISSIONS.DELETE_ANY_LISTING)
export const manageEmulatorVerifiedDevelopersProcedure = permissionProcedure(
  PERMISSIONS.MANAGE_EMULATOR_VERIFIED_DEVELOPERS,
)
