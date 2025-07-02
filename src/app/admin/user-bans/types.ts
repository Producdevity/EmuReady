import { type RouterOutput } from '@/types/trpc'

export type UserBanWithDetails = RouterOutput['userBans']['getAll']['bans'][0]

export interface BanModalState {
  isOpen: boolean
  ban?: UserBanWithDetails
}

export interface CreateBanModalState {
  isOpen: boolean
  userId?: string
}
