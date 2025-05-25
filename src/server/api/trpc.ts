import superjson from 'superjson'
import { ZodError } from 'zod'
import { getServerSession, type Session } from 'next-auth'
import { initTRPC } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { hasPermission } from '@/utils/permissions'
import { prisma } from '@/server/db'
import { authOptions } from '@/server/auth'
import { Role } from '@orm'
import { AppError } from '@/lib/errors'

type CreateContextOptions = {
  session: Session | null
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  }
}

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts
  const session = await getServerSession(req, res, authOptions)

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
  if (!ctx.session?.user) {
    AppError.unauthorized()
  }

  if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
    AppError.insufficientPermissions('SUPER_ADMIN')
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})
