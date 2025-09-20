import { API_KEY_LIMITS } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import { generateApiKey, parseApiKey, verifyApiKey } from '@/lib/security/apiKey'
import {
  type CreateApiKeyInput,
  type ListApiKeysInput,
  type UpdateApiKeyQuotaInput,
  type GetApiKeyUsageInput,
} from '@/schemas/apiAccess'
import {
  ApiKeysRepository,
  ApiKeyUsageRepository,
  type ApiKeyWithUser,
} from '@/server/repositories/api-keys.repository'
import { type PrismaClient, ApiUsagePeriod } from '@orm'

interface GenerateKeyResult {
  apiKey: ApiKeyWithUser
  plaintext: string
}

function assertApiKeyExists(key: ApiKeyWithUser | null): asserts key is ApiKeyWithUser {
  if (!key) ResourceError.apiKey.notFound()
}

export class ApiAccessService {
  private readonly apiKeys: ApiKeysRepository
  private readonly usage: ApiKeyUsageRepository

  constructor(private readonly prisma: PrismaClient) {
    this.apiKeys = new ApiKeysRepository(prisma)
    this.usage = new ApiKeyUsageRepository(prisma)
  }

  async createKeyForUser(
    userId: string,
    input: CreateApiKeyInput = {},
  ): Promise<GenerateKeyResult> {
    const generated = generateApiKey()

    const monthlyQuota = input.monthlyQuota ?? API_KEY_LIMITS.DEFAULT_MONTHLY
    const weeklyQuota = input.weeklyQuota ?? API_KEY_LIMITS.DEFAULT_WEEKLY
    const burstQuota = input.burstQuota ?? API_KEY_LIMITS.DEFAULT_BURST_PER_MINUTE

    const apiKey = await this.apiKeys.create({
      ...input,
      userId,
      prefix: generated.prefix,
      secretHash: generated.hash,
      salt: generated.salt,
      monthlyQuota,
      weeklyQuota,
      burstQuota,
    })

    return { apiKey, plaintext: generated.key }
  }

  async rotateKey(keyId: string): Promise<GenerateKeyResult> {
    const existing = await this.getKeyByIdOrThrow(keyId)

    await this.apiKeys.revoke(keyId)

    const generated = generateApiKey()

    const apiKey = await this.apiKeys.create({
      userId: existing.userId,
      prefix: generated.prefix,
      secretHash: generated.hash,
      salt: generated.salt,
      name: existing.name ?? undefined,
      monthlyQuota: existing.monthlyQuota,
      weeklyQuota: existing.weeklyQuota,
      burstQuota: existing.burstQuota,
      expiresAt: existing.expiresAt?.toISOString(),
      isSystemKey: existing.isSystemKey,
    })

    return { apiKey, plaintext: generated.key }
  }

  async revokeKey(keyId: string): Promise<void> {
    await this.apiKeys.revoke(keyId)
  }

  async updateQuota(input: UpdateApiKeyQuotaInput) {
    return this.apiKeys.updateQuotas(input)
  }

  async list(keysFilters: ListApiKeysInput = {}) {
    return this.apiKeys.list(keysFilters)
  }

  async getKeyById(id: string) {
    return this.apiKeys.byId(id)
  }

  async getKeyByIdOrThrow(id: string): Promise<ApiKeyWithUser> {
    const existing = await this.apiKeys.byId(id)
    assertApiKeyExists(existing)
    return existing
  }

  async getUsageSeries(input: GetApiKeyUsageInput) {
    const series = await this.usage.getSeries(input.id, input.period, input.limit)

    const oldestWindow = series.at(-1)
    if (oldestWindow) {
      await this.usage.resetOlderThan(input.id, input.period, oldestWindow.windowStart)
    }

    return series
  }

  async authorize(rawKey: string): Promise<ApiKeyWithUser | null> {
    const parsed = parseApiKey(rawKey)
    if (!parsed) return null

    const apiKey = await this.apiKeys.byPrefix(parsed.prefix)
    if (!apiKey) return null

    if (apiKey.revokedAt) return null
    if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) return null

    const isValid = verifyApiKey(parsed.payload, apiKey.salt, apiKey.secretHash)
    if (!isValid) return null

    return apiKey
  }

  async consumeRequest(apiKey: ApiKeyWithUser, now = new Date()): Promise<void> {
    if (apiKey.isSystemKey) {
      await this.apiKeys.markUsage(apiKey.id, now)
      return
    }

    await this.prisma.$transaction(async (tx) => {
      const usageRepo = new ApiKeyUsageRepository(tx)
      const keyRepo = new ApiKeysRepository(tx)

      await usageRepo.incrementWithinLimit(apiKey.id, ApiUsagePeriod.MINUTE, apiKey.burstQuota, now)
      await usageRepo.incrementWithinLimit(apiKey.id, ApiUsagePeriod.WEEK, apiKey.weeklyQuota, now)
      await usageRepo.incrementWithinLimit(
        apiKey.id,
        ApiUsagePeriod.MONTH,
        apiKey.monthlyQuota,
        now,
      )

      await keyRepo.markUsage(apiKey.id, now)
    })
  }

  async getAdminStats() {
    return this.apiKeys.stats()
  }

  async getDeveloperStats(userId: string) {
    return this.apiKeys.stats({ userId })
  }
}
