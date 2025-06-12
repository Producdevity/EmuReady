import { auth } from '@clerk/nextjs/server'
import { initTRPC } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { AppError } from '@/lib/errors'
import { prisma } from '@/server/db'
import { type Nullable } from '@/types/utils'
import { hasPermission } from '@/utils/permissions'
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

type CreateContextOptions = {
  session: Nullable<Session>
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  }
}

export const createTRPCContext = async (_opts: CreateNextContextOptions) => {
  const { userId } = await auth()

  let session: Nullable<Session> = null

  if (userId) {
    // Find user in database - they should exist due to webhook sync
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
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
      // User not found in database - this shouldn't happen with webhooks
      // In development, this is common when webhooks aren't set up
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `🔧 Dev mode: User with clerkId ${userId} not found in database.`,
        )
        console.warn(
          '   Either run the seeder (npx prisma db seed) or set up webhooks for auto-sync.',
        )
        console.warn('   See DEVELOPMENT_SETUP.md for details.')
      } else {
        console.warn(
          `User with clerkId ${userId} not found in database. Check webhook configuration.`,
        )
      }
    }
  }

  return createInnerTRPCContext({ session })
}

export type TRPCContext = ReturnType<typeof createInnerTRPCContext>

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter(ctx) {
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

export const createTRPCRouter = t.router

/**
 * Public (unauthed) procedure
 */
export const publicProcedure = t.procedure

/**
 * Middleware to check if a user is signed in
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) AppError.unauthorized()

  return next({
    ctx: { session: { ...ctx.session, user: ctx.session.user } },
  })
})

/**
 * Middleware to check if a user has at least Author role
 */
export const authorProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    AppError.unauthorized()
  }

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
 * Middleware to check if a user has Admin role
 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    AppError.unauthorized()
  }

  if (!hasPermission(ctx.session.user.role, Role.ADMIN)) {
    AppError.insufficientPermissions('ADMIN')
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/**
 * Middleware to check if a user has SUPER_ADMIN role
 */
export const superAdminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) return AppError.unauthorized()

  if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
    AppError.insufficientPermissions(Role.SUPER_ADMIN)
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})
