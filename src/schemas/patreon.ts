import { z } from 'zod'

export const PatreonOAuthStateSchema = z.object({
  state: z.string().min(8),
})

export const PatreonWebhookSchema = z.object({
  // Minimal scaffolding; full schema added during webhook wiring
  // We accept unknown and validate key fields at handler level
  payload: z.unknown(),
})

export type PatreonOAuthState = z.infer<typeof PatreonOAuthStateSchema>
