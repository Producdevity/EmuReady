import { Shield, TrendingUp, Users } from 'lucide-react'
import type { RouterOutput } from '@/types/trpc'

type TrustStats = NonNullable<RouterOutput['trust']['getTrustStats']>

interface Props {
  trustStatsData: TrustStats
}

function TrustStatsOverview(props: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Actions</h3>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              {props.trustStatsData.totalActions}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h3>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              {props.trustStatsData.totalUsers}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Trusted+ Users</h3>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              {props.trustStatsData.levelDistribution
                ?.filter((level) => level.minScore >= 250)
                ?.reduce((sum, level) => sum + level.count, 0) ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrustStatsOverview
