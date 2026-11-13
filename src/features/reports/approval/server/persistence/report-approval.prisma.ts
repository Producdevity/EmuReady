import { type Prisma } from '@orm'

const APPROVAL_SELECT = {
  id: true,
  status: true,
  authorId: true,
  gameId: true,
  emulatorId: true,
  processedAt: true,
  processedNotes: true,
  author: {
    select: {
      userBans: {
        where: { isActive: true },
        select: { reason: true, expiresAt: true },
      },
    },
  },
} as const

export const HANDHELD_APPROVAL_SELECT = {
  ...APPROVAL_SELECT,
  deviceId: true,
} satisfies Prisma.ListingSelect

export const PC_APPROVAL_SELECT = {
  ...APPROVAL_SELECT,
  cpuId: true,
  gpuId: true,
} satisfies Prisma.PcListingSelect
