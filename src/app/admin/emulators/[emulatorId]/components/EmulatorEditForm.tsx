'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { EmulatorIcon } from '@/components/icons'
import { Button, Input } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import updateEmulatorSchema, {
  type UpdateEmulatorFormData,
} from '../form-schemas/updateEmulatorSchema'

type Emulator = NonNullable<RouterOutput['emulators']['byId']>

interface Props {
  emulator: Emulator
}

const logoOptions = [
  'aethersx2.png',
  'azahar.png',
  'cemu.png',
  'citra.png',
  'citron.png',
  'cxbx.png',
  'dolphin.png',
  'drastic.png',
  'duckstation.png',
  'eden.png',
  'exagear.png',
  'flycast.png',
  'gamefusion.png',
  'gamehub.png',
  'gamenative.png',
  'horizon.png',
  'lemuroid.png',
  'lime3ds.png',
  'melonds.png',
  'melonx.png',
  'micewine.png',
  'mobox.png',
  'nethersx2.png',
  'pcsx2.png',
  'pluvia.png',
  'ppsspp.png',
  'redream.png',
  'retroarch.png',
  'rpcs3.png',
  'rpcsx.png',
  'ryujinx.png',
  'shadps4.png',
  'skyline.png',
  'sudachi.png',
  'torzu.png',
  'utm.png',
  'vita3k.png',
  'winlator.png',
  'xbsx2.png',
  'xemu.png',
  'xenia.png',
  'yaba.png',
  'yuzu.png',
]

function EmulatorEditForm(props: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const utils = api.useUtils()

  const updateEmulator = api.emulators.update.useMutation({
    onSuccess: async () => {
      toast.success('Emulator updated successfully')
      setIsSubmitting(false)
      try {
        await utils.emulators.byId.invalidate({ id: props.emulator.id })
        await utils.emulators.get.invalidate()
      } catch (error) {
        console.error('Error invalidating emulator cache:', error)
      }
    },
    onError: (error) => {
      toast.error(`Failed to update emulator: ${getErrorMessage(error)}`)
      console.error('Error updating emulator:', error)
      setIsSubmitting(false)
    },
  })

  const { register, handleSubmit, formState, setValue, watch } =
    useForm<UpdateEmulatorFormData>({
      resolver: zodResolver(updateEmulatorSchema),
      defaultValues: {
        name: props.emulator.name,
        logo: props.emulator.logo ?? '',
      },
    })

  const watchedLogo = watch('logo')

  const onSubmit = (data: UpdateEmulatorFormData) => {
    setIsSubmitting(true)
    updateEmulator.mutate({
      id: props.emulator.id,
      name: data.name,
      logo: data.logo || undefined,
    })
  }

  const handleLogoSelect = (logoFileName: string) => {
    setValue('logo', logoFileName, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const handleLogoClear = () => {
    setValue('logo', '', {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Emulator Name
          </label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter emulator name"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
          {formState.errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 dark:text-red-400"
            >
              {formState.errors.name.message}
            </motion.p>
          )}
        </div>

        {/* Logo Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Logo Preview
          </label>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <EmulatorIcon
              logo={watchedLogo}
              name={watch('name')}
              showLogo={!!watchedLogo}
              size="lg"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {watchedLogo ? (
                <>
                  <p className="font-medium">Using: {watchedLogo}</p>
                  <button
                    type="button"
                    onClick={handleLogoClear}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 mt-1"
                  >
                    <X className="h-3 w-3" />
                    Clear logo
                  </button>
                </>
              ) : (
                <p>No logo selected</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logo Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Available Logos
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-64 overflow-y-auto">
          {logoOptions.map((logoFileName) => (
            <motion.button
              key={logoFileName}
              type="button"
              onClick={() => handleLogoSelect(logoFileName)}
              className={`
                relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105
                ${
                  watchedLogo === logoFileName
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={logoFileName.replace('.png', '')}
            >
              <EmulatorIcon
                logo={logoFileName}
                name={logoFileName.replace('.png', '')}
                className="w-full"
                showLogo={true}
                size="sm"
              />
              {watchedLogo === logoFileName && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        {formState.errors.logo && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 dark:text-red-400"
          >
            {formState.errors.logo.message}
          </motion.p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting || !formState.isDirty}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </motion.form>
  )
}

export default EmulatorEditForm
