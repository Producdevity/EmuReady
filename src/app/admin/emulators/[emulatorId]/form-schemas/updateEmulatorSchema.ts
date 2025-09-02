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
      message: 'Logo must be a valid image filename (jpg, jpeg, png, gif, webp)',
    })
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  repositoryUrl: z.string().url('Repository URL must be a valid URL').optional().or(z.literal('')),
  officialUrl: z.string().url('Official URL must be a valid URL').optional().or(z.literal('')),
  androidGithubRepoUrl: z
    .string()
    .url('Android GitHub Repo URL must be a valid URL')
    .optional()
    .or(z.literal('')),
})

export default updateEmulatorSchema
export type UpdateEmulatorFormData = z.infer<typeof updateEmulatorSchema>
