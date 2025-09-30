import { z } from 'zod'
import { EntitlementSource } from '@orm'

export const ClaimPlayOrderSchema = z.object({
  orderId: z
    .string()
    .min(10)
    .max(128)
    .regex(/^GPA\.[A-Z0-9\-.]+$/i, 'Invalid Google Play order ID (expected GPA.*)')
    .describe('Google Play order id starting with GPA.'),
})

export const LinkPatreonStartSchema = z.object({
  redirectTo: z.string().url().optional(),
})

export const LinkPatreonCallbackSchema = z.object({
  code: z.string().min(4),
  state: z.string().min(8),
})

export const AdminGrantEntitlementSchema = z.object({
  userId: z.string().uuid(),
  source: z.nativeEnum(EntitlementSource),
  referenceId: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export const AdminRevokeEntitlementSchema = z.object({
  entitlementId: z.string().uuid(),
})

export type ClaimPlayOrderInput = z.infer<typeof ClaimPlayOrderSchema>
export type LinkPatreonStartInput = z.infer<typeof LinkPatreonStartSchema>
export type LinkPatreonCallbackInput = z.infer<typeof LinkPatreonCallbackSchema>
export type AdminGrantEntitlementInput = z.infer<typeof AdminGrantEntitlementSchema>
export type AdminRevokeEntitlementInput = z.infer<typeof AdminRevokeEntitlementSchema>
