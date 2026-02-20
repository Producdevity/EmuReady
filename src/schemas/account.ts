import { z } from 'zod'

export const RevokeSessionSchema = z.object({
  sessionId: z.string().min(1),
})

export type RevokeSessionInput = z.infer<typeof RevokeSessionSchema>
