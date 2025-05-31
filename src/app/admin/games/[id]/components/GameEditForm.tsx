'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Button, Input } from '@/components/ui'
import toast from '@/lib/toast'
import { type RouterOutput, type RouterInput } from '@/types/trpc'

type Game = NonNullable<RouterOutput['games']['byId']>

const updateGameSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  systemId: z.string().uuid('Please select a system'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type UpdateGameInput = Omit<RouterInput['games']['update'], 'id'>

interface Props {
  game: Game
}

function GameEditForm(props: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: systems } = api.systems.get.useQuery()

  const updateGame = api.games.update.useMutation({
    onSuccess: () => {
      toast.success('Game updated successfully')
      router.refresh()
    },
    onError: (error) => {
      toast.error(`Failed to update game: ${error.message}`)
      setIsSubmitting(false)
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateGameInput>({
    resolver: zodResolver(updateGameSchema),
    defaultValues: {
      title: props.game.title,
      systemId: props.game.systemId,
      imageUrl: props.game.imageUrl ?? '',
    },
  })

  const onSubmit = (data: UpdateGameInput) => {
    setIsSubmitting(true)
    updateGame.mutate({
      id: props.game.id,
      ...data,
    })
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
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.title.message}
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
        <select
          id="systemId"
          value={watch('systemId')}
          onChange={(e) => setValue('systemId', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Select a system</option>
          {systems?.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </select>
        {errors.systemId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.systemId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="imageUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Image URL (optional)
        </label>
        <Input
          id="imageUrl"
          {...register('imageUrl')}
          placeholder="https://example.com/game-image.jpg"
        />
        {errors.imageUrl && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.imageUrl.message}
          </p>
        )}
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

export default GameEditForm
