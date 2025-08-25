import { z } from 'zod'

// Schema for external game IDs stored in the metadata field
export const GameMetadataSchema = z.object({
  tgdbId: z.number().optional(),
  rawgId: z.number().optional(),
  igdbId: z.number().optional(),
})

export type GameMetadata = z.infer<typeof GameMetadataSchema>

// Helper to validate and parse metadata
export function parseGameMetadata(metadata: unknown): GameMetadata | null {
  try {
    if (!metadata) return null
    return GameMetadataSchema.parse(metadata)
  } catch {
    return null
  }
}

// Helper to create metadata object
export function createGameMetadata(data: Partial<GameMetadata>): GameMetadata {
  return GameMetadataSchema.parse(data)
}

// Helper to extract tgdbGameId with backward compatibility
// Priority: tgdbGameId field first, then metadata.tgdbId as fallback
export function getTgdbGameId(game: {
  tgdbGameId?: number | null
  metadata?: unknown
}): number | null {
  // First check the direct tgdbGameId field - use explicit number type checking
  if (typeof game.tgdbGameId === 'number') {
    return game.tgdbGameId
  }

  // Fallback to metadata.tgdbId for backward compatibility
  const metadata = parseGameMetadata(game.metadata)
  if (typeof metadata?.tgdbId === 'number') {
    return metadata.tgdbId
  }

  return null
}
