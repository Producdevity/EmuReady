import { env } from '@/lib/env'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
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
  hasPaidOnceForCampaign,
  hasActivePledgeForCampaign,
  PatreonError,
  getPatreonCampaignId,
} from '@/server/services/patreon.service'
import { EntitlementSource, EntitlementStatus } from '@orm'

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
    const clientSecret = process.env.PATREON_CLIENT_SECRET
    const creatorToken = process.env.PATREON_CREATOR_TOKEN
    const campaignId = process.env.PATREON_CAMPAIGN_ID

    if (!clientId || !clientSecret) {
      logger.error('[entitlements] Patreon client credentials missing', {
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
      })
      return AppError.internalError(
        'Patreon integration is not currently available. Please contact support.',
      )
    }

    if (!creatorToken && !campaignId) {
      logger.error('[entitlements] Patreon campaign credentials missing', {
        hasCreatorToken: Boolean(creatorToken),
        hasCampaignId: Boolean(campaignId),
      })
      return AppError.internalError(
        'Patreon integration is not currently available. Please contact support.',
      )
    }

    // Choose redirect URI dynamically to avoid invalid_grant due to env mismatch
    const forwardedProto = ctx.headers?.get('x-forwarded-proto') || 'http'
    const forwardedHost = ctx.headers?.get('x-forwarded-host') || ctx.headers?.get('host')
    const inferredBase = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : process.env.NEXT_PUBLIC_APP_URL
    const dynamicRedirect = `${inferredBase}/auth/patreon/callback`
    const redirectUri = process.env.PATREON_REDIRECT_URI || dynamicRedirect
    const scope = encodeURIComponent('identity identity[email] identity.memberships')
    const state = oauthState.sign(ctx.session.user.id, 600, redirectUri)
    const url = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`
    return { url }
  }),

  linkPatreonCallback: protectedProcedure
    .input(LinkPatreonCallbackSchema)
    .mutation(async ({ ctx, input }) => {
      const forwardedProto = ctx.headers?.get('x-forwarded-proto') || 'http'
      const forwardedHost = ctx.headers?.get('x-forwarded-host') || ctx.headers?.get('host')
      const inferredBase = forwardedHost ? `${forwardedProto}://${forwardedHost}` : env.APP_URL
      const payload = oauthState.verify(input.state)
      const redirectUri =
        payload.ru || process.env.PATREON_REDIRECT_URI || `${inferredBase}/auth/patreon/callback`
      if (payload.sub !== ctx.session.user.id) return AppError.forbidden('State subject mismatch')
      // Idempotency: if the user already has an active PATREON entitlement, succeed silently
      const already = await ctx.prisma.entitlement.findFirst({
        where: {
          userId: ctx.session.user.id,
          source: EntitlementSource.PATREON,
          status: EntitlementStatus.ACTIVE,
        },
        select: { id: true },
      })
      if (already) return { ok: true }

      let token: { access_token: string }
      try {
        token = await patreonExchangeCode(input.code, redirectUri)
      } catch (e) {
        logger.error('[entitlements] patreonExchangeCode error', e)
        if (e instanceof PatreonError) {
          if (e.status === 429)
            return AppError.tooManyRequests('Patreon is rate limiting. Please try again shortly.')
          if (e.status === 400 && e.code === 'invalid_grant')
            return AppError.badRequest('Authorization code invalid or already used. Try again.')
          if (e.status === 401 && e.code === 'invalid_grant')
            return AppError.badRequest('Invalid grant: Redirect URI mismatch or code already used.')
          return AppError.custom('INTERNAL_SERVER_ERROR', 'Patreon token exchange failed')
        }
        return AppError.custom('INTERNAL_SERVER_ERROR', 'Patreon token exchange failed')
      }
      let identity: unknown
      try {
        identity = await patreonFetchIdentity(token.access_token)
      } catch (e) {
        if (e instanceof PatreonError) {
          logger.error('[entitlements] patreonFetchIdentity error', e)
          return e.status === 429
            ? AppError.tooManyRequests('Patreon is rate limiting. Please try again shortly.')
            : AppError.custom('INTERNAL_SERVER_ERROR', 'Patreon identity fetch failed')
        }
        return AppError.custom('INTERNAL_SERVER_ERROR', 'Patreon identity fetch failed')
      }
      const campaignId = await getPatreonCampaignId()
      const grantOnActive = process.env.PATREON_GRANT_ON_ACTIVE_PLEDGE === 'true'

      if (!campaignId) {
        logger.warn(
          '[entitlements] Campaign id unavailable; refusing grant (check PATREON_CAMPAIGN_ID or PATREON_CREATOR_TOKEN)',
        )
        return {
          ok: false,
          message: 'Patreon verification is not configured. Please try again later.',
        }
      }

      const eligible =
        hasPaidOnceForCampaign(identity, campaignId) ||
        (grantOnActive && hasActivePledgeForCampaign(identity, campaignId))

      if (!eligible) {
        const reason = grantOnActive
          ? 'No active pledge or paid month found yet'
          : 'No successful paid month found yet'
        return { ok: false, message: reason }
      }
      const repo = new EntitlementsRepository(ctx.prisma)
      await repo.grant(ctx.session.user.id, EntitlementSource.PATREON, { referenceId: undefined })
      // Store external account mapping for auditability
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
      } catch (err) {
        logger.error('[entitlements] externalAccount upsert failed', err)
      }
      // Record event for traceability
      try {
        const eventId = `oauth:${Date.now()}:${ctx.session.user.id}`
        await ctx.prisma.webhookEvent.create({
          data: {
            source: EntitlementSource.PATREON,
            eventId,
            payload: identity as unknown as object,
            status: 'PROCESSED',
          },
        })
      } catch (err) {
        logger.error('[entitlements] webhookEvent create failed', err)
      }
      return { ok: true }
    }),
})
