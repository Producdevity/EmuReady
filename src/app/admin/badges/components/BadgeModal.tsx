'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  Button,
  Input,
  Toggle,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type Badge = RouterOutput['badges']['get']['badges'][number]

const badgeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color'),
  icon: z.string().max(50, 'Icon must be 50 characters or less').optional(),
  isActive: z.boolean(),
})

type BadgeFormData = z.infer<typeof badgeSchema>

interface BadgeModalProps {
  isOpen: boolean
  onClose: () => void
  badge?: Badge
  onSuccess: () => void
}

export default function BadgeModal({ isOpen, onClose, badge, onSuccess }: BadgeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(badge)

  const form = useForm<BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      isActive: true,
    },
  })

  // Update form values when badge prop changes
  useEffect(() => {
    if (badge) {
      form.reset({
        name: badge.name,
        description: badge.description || '',
        color: badge.color,
        icon: badge.icon || '',
        isActive: badge.isActive,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: '',
        isActive: true,
      })
    }
  }, [badge, form])

  const createBadgeMutation = api.badges.create.useMutation({
    onSuccess: () => {
      toast.success('Badge created successfully')
      onSuccess()
      onClose()
      form.reset()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create badge'))
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const updateBadgeMutation = api.badges.update.useMutation({
    onSuccess: () => {
      toast.success('Badge updated successfully')
      onSuccess()
      onClose()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update badge'))
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handleSubmit = async (data: BadgeFormData) => {
    setIsSubmitting(true)

    if (isEditing && badge) {
      await updateBadgeMutation.mutateAsync({
        id: badge.id,
        ...data,
      })
    } else {
      await createBadgeMutation.mutateAsync(data)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      form.reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Badge' : 'Create New Badge'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Name
              </label>
              <Input id="name" {...form.register('name')} placeholder="Enter badge name" />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <Input
                as="textarea"
                id="description"
                {...form.register('description')}
                placeholder="Enter badge description (optional)"
                rows={3}
              />
            </div>

            <div>
              <label
                htmlFor="color"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Color
              </label>
              <div className="flex items-center gap-3">
                <Input id="color" type="color" {...form.register('color')} className="w-20 h-10" />
                <Input {...form.register('color')} placeholder="#3B82F6" className="flex-1" />
              </div>
            </div>

            <div>
              <label
                htmlFor="icon"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Icon
              </label>
              <Input
                id="icon"
                {...form.register('icon')}
                placeholder="Enter icon name (optional)"
              />
            </div>

            <div className="flex items-center gap-3">
              <Toggle
                checked={form.watch('isActive')}
                onChange={(checked: boolean) => form.setValue('isActive', checked)}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
              {isEditing ? 'Update Badge' : 'Create Badge'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
