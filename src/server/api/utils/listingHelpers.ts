import type { Prisma } from '@orm'

export type ProcessedSortField =
  | 'processedAt'
  | 'createdAt'
  | 'status'
  | 'game.title'
  | 'game.system.name'
  | 'device'
  | 'emulator.name'
  | 'author.name'

export type ProcessedSortDirection = 'asc' | 'desc'

export function buildProcessedOrderBy(
  sortField: ProcessedSortField | null | undefined,
  sortDirection: ProcessedSortDirection | null | undefined,
): Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] {
  const direction: Prisma.SortOrder = sortDirection ?? 'desc'

  switch (sortField) {
    case 'createdAt':
      return { createdAt: direction }
    case 'status':
      return { status: direction }
    case 'game.title':
      return { game: { title: direction } }
    case 'game.system.name':
      return { game: { system: { name: direction } } }
    case 'device':
      return [{ device: { brand: { name: direction } } }, { device: { modelName: direction } }]
    case 'emulator.name':
      return { emulator: { name: direction } }
    case 'author.name':
      return { author: { name: direction } }
    case 'processedAt':
    case null:
    case undefined:
      return { processedAt: direction }
  }
}
