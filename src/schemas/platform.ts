import { z } from 'zod'
import { PcOs, PlatformScope } from '@orm'

export const GetPlatformsSchema = z
  .object({
    scope: z.nativeEnum(PlatformScope).optional(),
    scopes: z.array(z.nativeEnum(PlatformScope)).optional(),
  })
  .optional()

export const GetPlatformByIdSchema = z.object({ id: z.string().uuid() })

export const GetCompatiblePlatformsSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('device'), deviceId: z.string().uuid() }),
  z.object({ kind: z.literal('os'), os: z.nativeEnum(PcOs) }),
])
