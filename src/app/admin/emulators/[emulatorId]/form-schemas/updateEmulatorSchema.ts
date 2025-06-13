import { z } from 'zod'
import { isValidImageFilename } from '@/utils/imageValidation'

const updateEmulatorSchema = z.object({
  name: z
    .string()
    .min(1, 'Emulator name is required')
    .max(100, 'Emulator name must be less than 100 characters')
    .trim(),
  logo: z
    .string()
    .refine((val) => val === '' || isValidImageFilename(val), {
      message:
        'Logo must be a valid image filename (jpg, jpeg, png, gif, webp)',
    })
    .optional()
    .or(z.literal('')),
})

export default updateEmulatorSchema
export type UpdateEmulatorFormData = z.infer<typeof updateEmulatorSchema>
