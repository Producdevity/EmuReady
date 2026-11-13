import { type Prisma } from '@orm'

export const GAME_MODERATION_SELECT = {
  id: true,
  title: true,
  systemId: true,
  status: true,
  submittedBy: true,
} satisfies Prisma.GameSelect

export type GameModerationRecord = Prisma.GameGetPayload<{
  select: typeof GAME_MODERATION_SELECT
}>
