import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { type Session } from 'next-auth'

import { type prisma } from '@/server/db'

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request.
 */

interface CreateContextOptions {
  session: Session | null
  prisma: typeof prisma
}

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint.
 */
export type TRPCContext = CreateContextOptions

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthed) procedure
 */
export const publicProcedure = t.procedure

/**
 * Middleware to check if a user is signed in
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      prisma: ctx.prisma,
    },
  })
})

/**
 * Protected (authed) procedure
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

/**
 * Middleware to check if a user has at least Author role
 */
const enforceUserIsAuthor = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (ctx.session.user.role !== 'AUTHOR' && ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Author role required' })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      prisma: ctx.prisma,
    },
  })
})

/**
 * Author (at least author role) procedure
 */
export const authorProcedure = t.procedure.use(enforceUserIsAuthor)

/**
 * Middleware to check if a user has Admin role
 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin role required' })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      prisma: ctx.prisma,
    },
  })
})

/**
 * Admin procedure
 */
export const adminProcedure = t.procedure.use(enforceUserIsAdmin)
