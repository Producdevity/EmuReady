import { type RouterOutput } from '@/types/trpc'

export interface KeyDialogState {
  title: string
  plaintext: string
  masked: string
}

export type AdminApiKeyRow = RouterOutput['apiKeys']['adminList']['keys'][number]
export type DeveloperApiKeyRow = RouterOutput['apiKeys']['listMine']['keys'][number]
export type ApiPagination = RouterOutput['apiKeys']['adminList']['pagination']
export type DeveloperPagination = RouterOutput['apiKeys']['listMine']['pagination']
export type UserOption = RouterOutput['users']['searchUsers'][number]
