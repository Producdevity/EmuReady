import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import { ms } from '@/utils/time'

export type DriverVersionsResponse = RouterOutput['listings']['driverVersions']
export type DriverRelease = DriverVersionsResponse['releases'][number]

export function useDriverVersions() {
  const query = api.listings.driverVersions.useQuery(undefined, {
    staleTime: ms.minutes(30),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    data: query.data?.releases ?? null,
    rateLimited: query.data?.rateLimited ?? false,
    errorMessage: query.data?.errorMessage ?? null,
    loading: query.isLoading,
    reload: () => {
      void query.refetch()
    },
  }
}
