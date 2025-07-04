import { api } from '@/lib/api'

/**
 * Hook to check if a user is a verified developer for a specific emulator
 *
 * @param userId - The ID of the user to check
 * @param emulatorId - The ID of the emulator to check against
 * @returns Boolean indicating if the user is a verified developer
 */
function useVerifiedDeveloper(userId: string, emulatorId: string) {
  const query = api.verifiedDevelopers.isVerifiedDeveloper.useQuery(
    { userId, emulatorId },
    { enabled: !!userId && !!emulatorId },
  )

  return {
    isVerifiedDeveloper: query.data ?? false,
    isLoading: query.isPending,
    error: query.error,
  }
}

export default useVerifiedDeveloper
