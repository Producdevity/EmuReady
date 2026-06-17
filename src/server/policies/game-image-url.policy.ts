import { AppError } from '@/lib/errors'
import { getGameImageUrlValidationError, isKnownGameImageProviderUrl } from '@/utils/imageUrls'
import { hasPermission, PERMISSIONS, roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'

type GameImageField = 'imageUrl' | 'boxartUrl' | 'bannerUrl'

type GameImageInput = Partial<Record<GameImageField, string | null | undefined>>

type Actor = {
  role: Role
  permissions?: string[] | null
}

const GAME_IMAGE_FIELD_LABELS: Record<GameImageField, string> = {
  imageUrl: 'cover image URL',
  boxartUrl: 'box art URL',
  bannerUrl: 'banner image URL',
}

export function canUseArbitraryGameImageUrls(actor: Actor): boolean {
  return (
    roleIncludesRole(actor.role, Role.MODERATOR) ||
    hasPermission(actor.permissions, PERMISSIONS.EDIT_GAMES) ||
    hasPermission(actor.permissions, PERMISSIONS.MANAGE_GAMES)
  )
}

export function assertGameImageUrlsAllowed(input: GameImageInput, actor: Actor): void {
  const canUseArbitraryUrls = canUseArbitraryGameImageUrls(actor)

  for (const field of Object.keys(GAME_IMAGE_FIELD_LABELS) as GameImageField[]) {
    const value = input[field]
    if (!value) continue

    const validationError = getGameImageUrlValidationError(value)
    if (validationError) {
      AppError.badRequest(`Invalid ${GAME_IMAGE_FIELD_LABELS[field]}: ${validationError}`)
    }

    if (isKnownGameImageProviderUrl(value)) continue
    if (canUseArbitraryUrls) continue

    AppError.forbidden()
  }
}
