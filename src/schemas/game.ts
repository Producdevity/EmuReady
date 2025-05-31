import { z } from 'zod'

export const GameSortField = z.enum(['title', 'system.name', 'listingsCount'])

export const SortDirection = z.enum(['asc', 'desc'])

export const GetGamesSchema = z
  .object({
    systemId: z.string().uuid().optional(),
    search: z.string().optional(),
    limit: z.number().default(100),
    offset: z.number().default(0),
    page: z.number().optional(),
    sortField: GameSortField.optional(),
    sortDirection: SortDirection.optional(),
  })
  .optional()

export const GetGameByIdSchema = z.object({ id: z.string().uuid() })

export const CreateGameSchema = z.object({
  title: z.string().min(1),
  systemId: z.string().uuid(),
  imageUrl: z.string().optional(),
})

export const UpdateGameSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  systemId: z.string().uuid(),
  imageUrl: z.string().optional(),
})

export const DeleteGameSchema = z.object({ id: z.string().uuid() })
