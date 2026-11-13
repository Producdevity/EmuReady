import { z } from 'zod'

export const BooleanPreferenceSchema = z.boolean()
export const PageSizePreferenceSchema = z.number().int().positive()
export const NullableStringPreferenceSchema = z.string().nullable()
export const CookiePreferencesSchema = z.object({
  necessary: z.boolean(),
  analytics: z.boolean(),
  performance: z.boolean(),
})
export const SavedCookiePreferencesSchema = CookiePreferencesSchema.nullable()
export const LastUsedDeviceSchema = z
  .object({
    id: z.string(),
    brand: z.object({ id: z.string(), name: z.string() }),
    modelName: z.string(),
    soc: z.object({ id: z.string(), name: z.string(), manufacturer: z.string() }),
  })
  .nullable()
