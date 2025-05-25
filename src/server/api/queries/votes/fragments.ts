import type { Prisma } from '@orm'
import { deviceBasicSelect } from '../devices/fragments'
import { gameBasicSelect } from '../games/fragments'
import { emulatorBasicSelect } from '../emulators/fragments'
import { performanceBasicSelect } from '../performance/fragments'

// User votes fragment (for profile pages)
export const userVotesSelect = {
  id: true,
  value: true,
  listing: {
    select: {
      id: true,
      device: {
        select: deviceBasicSelect,
      },
      game: {
        select: gameBasicSelect,
      },
      emulator: {
        select: emulatorBasicSelect,
      },
      performance: {
        select: performanceBasicSelect,
      },
    },
  },
} satisfies Prisma.VoteSelect

// Helper to get user votes for listings (used in listing queries)
export function getUserVotesForListings(userId?: string) {
  if (!userId) return undefined

  return {
    where: { userId },
    select: { value: true },
  } satisfies Prisma.VoteFindManyArgs
}
