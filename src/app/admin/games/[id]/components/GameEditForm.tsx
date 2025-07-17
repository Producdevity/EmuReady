'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Input,
  Autocomplete,
  AdminImageSelectorSwitcher,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import updateGameSchema from '../form-schemas/updateGameSchema'

type Game = NonNullable<RouterOutput['games']['byId']>

type UpdateGameInput = Omit<RouterInput['games']['update'], 'id'>

interface Props {
  game: Game
}

export function GameEditForm(props: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const utils = api.useUtils()

  const systemsQuery = api.systems.get.useQuery()

  const updateGame = api.games.update.useMutation({
    onSuccess: () => {
      toast.success('Game updated successfully')
      utils.games.byId
        .invalidate({ id: props.game.id })
        .catch((error) => {
          console.error('Error invalidating game cache:', error)
          router.refresh()
        })
        .then(() => setIsSubmitting(false))
      utils.games.getPendingGames.invalidate().catch(console.error)
    },
    onError: (error) => {
      toast.error(`Failed to update game: ${getErrorMessage(error)}`)
      console.error('Error updating game:', error)
      setIsSubmitting(false)
    },
  })

  const { register, handleSubmit, formState, setValue, watch } =
    useForm<UpdateGameInput>({
      resolver: zodResolver(updateGameSchema),
      defaultValues: {
        title: props.game.title,
        systemId: props.game.systemId,
        imageUrl: props.game.imageUrl ?? '',
        boxartUrl: props.game.boxartUrl ?? '',
        bannerUrl: props.game.bannerUrl ?? '',
        ageRating: props.game.ageRating ?? '',
        isErotic: props.game.isErotic ?? false,
      },
    })

  const onSubmit = (data: UpdateGameInput) => {
    setIsSubmitting(true)
    updateGame.mutate({ id: props.game.id, ...data })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Title
        </label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter game title"
        />
        {formState.errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="systemId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          System
        </label>
        <Autocomplete
          value={watch('systemId')}
          onChange={(value) => setValue('systemId', value ?? '')}
          items={systemsQuery.data ?? []}
          optionToValue={(system) => system.id}
          optionToLabel={(system) => system.name}
          placeholder="Select a system"
          filterKeys={['name']}
        />
        {formState.errors.systemId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {formState.errors.systemId.message}
          </p>
        )}
      </div>

      <div>
        <AdminImageSelectorSwitcher
          label="Game Image (optional)"
          gameTitle={watch('title')}
          systemName={
            systemsQuery.data?.find((system) => system.id === watch('systemId'))
              ?.name
          }
          tgdbPlatformId={
            systemsQuery.data?.find((system) => system.id === watch('systemId'))
              ?.tgdbPlatformId || undefined
          }
          selectedImageUrl={watch('imageUrl')}
          onImageSelect={(url) =>
            setValue('imageUrl', url, { shouldValidate: true })
          }
          onError={(error) => console.error('Image selection error:', error)}
          placeholder="https://example.com/game-image.jpg"
        />
        {formState.errors.imageUrl && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {formState.errors.imageUrl.message}
          </p>
        )}
      </div>

      <div>
        <AdminImageSelectorSwitcher
          label="Boxart Image (optional)"
          gameTitle={watch('title')}
          systemName={
            systemsQuery.data?.find((system) => system.id === watch('systemId'))
              ?.name
          }
          tgdbPlatformId={
            systemsQuery.data?.find((system) => system.id === watch('systemId'))
              ?.tgdbPlatformId || undefined
          }
          selectedImageUrl={watch('boxartUrl')}
          onImageSelect={(url) =>
            setValue('boxartUrl', url, { shouldValidate: true })
          }
          onError={(error) => console.error('Boxart selection error:', error)}
          placeholder="https://example.com/boxart-image.jpg"
        />
        {formState.errors.boxartUrl && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {formState.errors.boxartUrl.message}
          </p>
        )}
      </div>

      <div>
        <AdminImageSelectorSwitcher
          label="Banner Image (optional)"
          gameTitle={watch('title')}
          systemName={
            systemsQuery.data?.find((system) => system.id === watch('systemId'))
              ?.name
          }
          tgdbPlatformId={
            systemsQuery.data?.find((system) => system.id === watch('systemId'))
              ?.tgdbPlatformId || undefined
          }
          selectedImageUrl={watch('bannerUrl')}
          onImageSelect={(url) =>
            setValue('bannerUrl', url, { shouldValidate: true })
          }
          onError={(error) => console.error('Banner selection error:', error)}
          placeholder="https://example.com/banner-image.jpg"
        />
        {formState.errors.bannerUrl && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {formState.errors.bannerUrl.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Age Rating
        </label>
        <Input {...register('ageRating')} placeholder="e.g. M" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isErotic"
          {...register('isErotic')}
          className="h-4 w-4"
        />
        <label
          htmlFor="isErotic"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Erotic 18+
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/games')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}
