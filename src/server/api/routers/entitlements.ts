import { AppError } from '@/lib/errors'
import {
  ClaimPlayOrderSchema,
  LinkPatreonCallbackSchema,
  LinkPatreonStartSchema,
} from '@/schemas/entitlements'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { EntitlementsRepository } from '@/server/repositories/entitlements.repository'
import { fetchPlayOrder, isPaidAppOrder } from '@/server/services/googlePlayOrders.service'
import { oauthState } from '@/server/services/oauthState.service'
import {
  patreonExchangeCode,
  patreonFetchIdentity,
  hasPaidOnce,
} from '@/server/services/patreon.service'
import { EntitlementSource } from '@orm'

export const entitlementsRouter = createTRPCRouter({
  // Returns current entitlements and a simple eligibility flag.
  // DB wiring is added after migrations are applied and Prisma client is regenerated.
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const repo = new EntitlementsRepository(ctx.prisma)
    const items = await repo.listActiveByUser(ctx.session.user.id)
    return { items, eligible: items.length > 0 }
  }),

  claimPlayOrder: protectedProcedure
    .input(ClaimPlayOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const packageName = process.env.ANDROID_PACKAGE_NAME
      if (!packageName) return AppError.internalError('ANDROID_PACKAGE_NAME missing')
      const order = await fetchPlayOrder(packageName, input.orderId)
      if (!isPaidAppOrder(order)) return AppError.badRequest('Order not recognized as paid app')
      const repo = new EntitlementsRepository(ctx.prisma)
      await repo.grant(ctx.session.user.id, EntitlementSource.PLAY, { referenceId: input.orderId })
      return { ok: true }
    }),

  linkPatreonStart: protectedProcedure.input(LinkPatreonStartSchema).mutation(async ({ ctx }) => {
    const clientId = process.env.PATREON_CLIENT_ID
    const redirectUri =
      process.env.PATREON_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/auth/patreon/callback`
    if (!clientId) return AppError.internalError('PATREON_CLIENT_ID missing')
    const scope = encodeURIComponent('identity identity[email] identity.memberships')
    const state = oauthState.sign(ctx.session.user.id)
    const url = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`
    return { url }
  }),

  linkPatreonCallback: protectedProcedure
    .input(LinkPatreonCallbackSchema)
    .mutation(async ({ ctx, input }) => {
      const redirectUri =
        process.env.PATREON_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/patreon/callback`
      const payload = oauthState.verify(input.state)
      if (payload.sub !== ctx.session.user.id) return AppError.forbidden('State subject mismatch')
      const token = await patreonExchangeCode(input.code, redirectUri)
      const identity = await patreonFetchIdentity(token.access_token)
      if (!hasPaidOnce(identity)) {
        return { ok: false, message: 'No successful paid month found yet' }
      }
      const repo = new EntitlementsRepository(ctx.prisma)
      await repo.grant(ctx.session.user.id, EntitlementSource.PATREON, { referenceId: undefined })
      // Store external account mapping for future support
      try {
        const idData = identity as unknown as {
          data?: { id?: string; attributes?: { email?: string } }
        }
        const externalId = idData?.data?.id
        const email = idData?.data?.attributes?.email
        if (externalId) {
          await ctx.prisma.externalAccount.upsert({
            where: { provider_externalId: { provider: 'patreon', externalId } },
            update: {
              userId: ctx.session.user.id,
              email: email ?? undefined,
              data: identity as unknown as object,
            },
            create: {
              userId: ctx.session.user.id,
              provider: 'patreon',
              externalId,
              email: email ?? null,
              data: identity as unknown as object,
            },
          })
        }
      } catch {
        // best-effort
      }
      // Record event for traceability
      try {
        const eventId = `oauth:${Date.now()}:${ctx.session.user.id}`
        await ctx.prisma.webhookEvent.create({
          data: {
            source: 'PATREON',
            eventId,
            payload: identity as unknown as object,
            status: 'PROCESSED',
          },
        })
      } catch {
        // best-effort
      }
      return { ok: true }
    }),
})
