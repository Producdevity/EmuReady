import { getTrustLevel, TRUST_LEVELS } from '@/lib/trust/config'
import type { TrustAdminRepository } from '@/server/repositories/trust-admin.repository'

export class TrustAdminService {
  constructor(private readonly repository: TrustAdminRepository) {}

  async statistics() {
    const data = await this.repository.statistics()
    const levelDistribution = TRUST_LEVELS.map((level) => {
      const count = data.scoreDistribution
        .filter((item) => getTrustLevel(item.trustScore).name === level.name)
        .reduce((sum, item) => sum + item._count.id, 0)

      return { name: level.name, minScore: level.minScore, count }
    })

    return { totalActions: data.totalActions, totalUsers: data.totalUsers, levelDistribution }
  }
}
