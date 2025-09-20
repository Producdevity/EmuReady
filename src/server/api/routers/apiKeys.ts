import { AppError } from '@/lib/errors'
import { maskApiKey } from '@/lib/security/apiKey'
import {
  type AdminCreateApiKeyInput,
  AdminCreateApiKeySchema,
  DeveloperCreateApiKeySchema,
  DeveloperListApiKeysSchema,
  GetApiKeyUsageSchema,
  ListApiKeysSchema,
  RevokeApiKeySchema,
  RotateApiKeySchema,
  UpdateApiKeyQuotaSchema,
} from '@/schemas/apiAccess'
import {
  adminProcedure,
  createTRPCRouter,
  developerProcedure,
  superAdminProcedure,
} from '@/server/api/trpc'
import { ApiAccessService } from '@/server/services/api-access.service'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import type { ApiKeyWithUser } from '@/server/repositories/api-keys.repository'
import type { PrismaClient } from '@orm'

function mapApiKey(apiKey: ApiKeyWithUser) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    monthlyQuota: apiKey.monthlyQuota,
    weeklyQuota: apiKey.weeklyQuota,
    burstQuota: apiKey.burstQuota,
    requestCount: apiKey.requestCount,
    isSystemKey: apiKey.isSystemKey,
    expiresAt: apiKey.expiresAt,
    revokedAt: apiKey.revokedAt,
    lastUsedAt: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
    user: {
      id: apiKey.user.id,
      email: apiKey.user.email,
      name: apiKey.user.name,
      role: apiKey.user.role,
    },
  }
}

function ensureKeyOwnership(apiKey: ApiKeyWithUser, userId: string, role: Role) {
  if (apiKey.user.id === userId) return
  if (hasRolePermission(role, Role.ADMIN)) return
  AppError.forbidden()
}

function assertSystemKeyPrivilege(input: AdminCreateApiKeyInput, role: Role) {
  if (input.isSystemKey && !hasRolePermission(role, Role.SUPER_ADMIN)) {
    AppError.insufficientRole(Role.SUPER_ADMIN)
  }
}

type DeveloperContext = {
  prisma: PrismaClient
  session: { user: { id: string; role: Role } }
}

async function getDeveloperKey(ctx: DeveloperContext, id: string) {
  const service = new ApiAccessService(ctx.prisma)
  const key = await service.getKeyByIdOrThrow(id)

  ensureKeyOwnership(key, ctx.session.user.id, ctx.session.user.role)

  return { service, key }
}

function assertWritableByDeveloper(key: ApiKeyWithUser, role: Role) {
  if (key.isSystemKey && !hasRolePermission(role, Role.SUPER_ADMIN)) {
    AppError.insufficientRole(Role.SUPER_ADMIN)
  }
}

export const apiKeysRouter = createTRPCRouter({
  create: adminProcedure.input(DeveloperCreateApiKeySchema).mutation(async ({ ctx, input }) => {
    const service = new ApiAccessService(ctx.prisma)
    const { apiKey, plaintext } = await service.createKeyForUser(ctx.session.user.id, input)

    return {
      apiKey: mapApiKey(apiKey),
      plaintext,
      masked: maskApiKey(plaintext),
    }
  }),

  listMine: developerProcedure
    .input(DeveloperListApiKeysSchema.optional())
    .query(async ({ ctx, input }) => {
      const service = new ApiAccessService(ctx.prisma)
      const { keys, pagination } = await service.list({
        ...(input ?? {}),
        userId: ctx.session.user.id,
      })
      return {
        keys: keys.map(mapApiKey),
        pagination,
      }
    }),

  rotate: developerProcedure.input(RotateApiKeySchema).mutation(async ({ ctx, input }) => {
    const { service, key: existing } = await getDeveloperKey(ctx, input.id)
    assertWritableByDeveloper(existing, ctx.session.user.role)

    const { apiKey, plaintext } = await service.rotateKey(input.id)
    return {
      apiKey: mapApiKey(apiKey),
      plaintext,
      masked: maskApiKey(plaintext),
    }
  }),

  revoke: developerProcedure.input(RevokeApiKeySchema).mutation(async ({ ctx, input }) => {
    const { service, key: existing } = await getDeveloperKey(ctx, input.id)
    assertWritableByDeveloper(existing, ctx.session.user.role)

    await service.revokeKey(existing.id)
    return { success: true }
  }),

  usage: developerProcedure.input(GetApiKeyUsageSchema).query(async ({ ctx, input }) => {
    const { service } = await getDeveloperKey(ctx, input.id)

    return await service.getUsageSeries(input)
  }),

  adminList: adminProcedure.input(ListApiKeysSchema).query(async ({ ctx, input }) => {
    const service = new ApiAccessService(ctx.prisma)
    const { keys, pagination } = await service.list(input)
    return {
      keys: keys.map(mapApiKey),
      pagination,
    }
  }),

  adminCreate: adminProcedure.input(AdminCreateApiKeySchema).mutation(async ({ ctx, input }) => {
    assertSystemKeyPrivilege(input, ctx.session.user.role)
    const service = new ApiAccessService(ctx.prisma)
    const { apiKey, plaintext } = await service.createKeyForUser(input.userId, input)
    return {
      apiKey: mapApiKey(apiKey),
      plaintext,
      masked: maskApiKey(plaintext),
    }
  }),

  adminUpdateQuota: adminProcedure
    .input(UpdateApiKeyQuotaSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ApiAccessService(ctx.prisma)
      const updated = await service.updateQuota(input)
      return mapApiKey(updated)
    }),

  adminRotate: adminProcedure.input(RotateApiKeySchema).mutation(async ({ ctx, input }) => {
    const service = new ApiAccessService(ctx.prisma)
    const existing = await service.getKeyByIdOrThrow(input.id)

    if (existing.isSystemKey && !hasRolePermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
      AppError.insufficientRole(Role.SUPER_ADMIN)
    }

    const { apiKey, plaintext } = await service.rotateKey(input.id)
    return {
      apiKey: mapApiKey(apiKey),
      plaintext,
      masked: maskApiKey(plaintext),
    }
  }),

  adminRevoke: adminProcedure.input(RevokeApiKeySchema).mutation(async ({ ctx, input }) => {
    const service = new ApiAccessService(ctx.prisma)
    const existing = await service.getKeyByIdOrThrow(input.id)

    if (existing.isSystemKey && !hasRolePermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
      AppError.insufficientRole(Role.SUPER_ADMIN)
    }

    await service.revokeKey(existing.id)
    return { success: true }
  }),

  adminUsage: adminProcedure.input(GetApiKeyUsageSchema).query(async ({ ctx, input }) => {
    const service = new ApiAccessService(ctx.prisma)
    return await service.getUsageSeries(input)
  }),

  adminSystemKeys: superAdminProcedure.query(async ({ ctx }) => {
    const service = new ApiAccessService(ctx.prisma)
    const { keys } = await service.list({ includeRevoked: true })
    return keys.filter((key) => key.isSystemKey).map(mapApiKey)
  }),

  myStats: developerProcedure.query(async ({ ctx }) => {
    const service = new ApiAccessService(ctx.prisma)
    return service.getDeveloperStats(ctx.session.user.id)
  }),

  adminStats: adminProcedure.query(async ({ ctx }) => {
    const service = new ApiAccessService(ctx.prisma)
    return service.getAdminStats()
  }),
})
