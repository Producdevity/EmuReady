import { z } from 'zod'

export const SavedEmulatorSettingSchema = z.object({
  customFieldDefinitionId: z.string().uuid(),
  value: z.union([z.string(), z.number().finite(), z.boolean()]),
})

export const LastEmulatorSettingsSchema = z
  .object({
    version: z.literal(1),
    values: z.array(SavedEmulatorSettingSchema),
  })
  .nullable()
