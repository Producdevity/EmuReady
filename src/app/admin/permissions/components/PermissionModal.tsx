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
  LoadingSpinner,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { PermissionCategory } from '@orm'

const permissionSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100, 'Key must be 100 characters or less'),
  label: z.string().min(1, 'Label is required').max(100, 'Label must be 100 characters or less'),
  description: z.string().max(255, 'Description must be 255 characters or less').optional(),
  category: z.nativeEnum(PermissionCategory),
})

type PermissionFormData = z.infer<typeof permissionSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  permission?: {
    id: string
    key: string
    label: string
    description?: string | null
    category?: PermissionCategory | null
  }
  onSuccess: () => void
}

export default function PermissionModal(props: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(props.permission)

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      key: '',
      label: '',
      description: '',
      category: PermissionCategory.CONTENT,
    },
  })

  // Update form values when permission prop changes
  useEffect(() => {
    if (props.permission) {
      form.reset({
        key: props.permission.key,
        label: props.permission.label,
        description: props.permission.description || '',
        category: props.permission.category ?? PermissionCategory.CONTENT,
      })
    } else {
      form.reset({
        key: '',
        label: '',
        description: '',
        category: PermissionCategory.CONTENT,
      })
    }
  }, [props.permission, form])

  const createPermissionMutation = api.permissions.create.useMutation({
    onSuccess: () => {
      toast.success('Permission created successfully')
      props.onSuccess()
      props.onClose()
      form.reset()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create permission'))
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const updatePermissionMutation = api.permissions.update.useMutation({
    onSuccess: () => {
      toast.success('Permission updated successfully')
      props.onSuccess()
      props.onClose()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update permission'))
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handleSubmit = async (data: PermissionFormData) => {
    setIsSubmitting(true)

    if (isEditing && props.permission) {
      await updatePermissionMutation.mutateAsync({
        id: props.permission.id,
        ...data,
      })
    } else {
      await createPermissionMutation.mutateAsync(data)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      props.onClose()
      form.reset()
    }
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Permission' : 'Create New Permission'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="key"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Permission Key
              </label>
              <Input
                id="key"
                {...form.register('key')}
                placeholder="e.g., MANAGE_USERS"
                disabled={isEditing} // Keys shouldn't be editable after creation
              />
              {form.formState.errors.key && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.key.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="label"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Label
              </label>
              <Input id="label" {...form.register('label')} placeholder="e.g., Manage Users" />
              {form.formState.errors.label && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.label.message}</p>
              )}
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
                placeholder="Enter permission description (optional)"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                {...form.register('category')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={PermissionCategory.CONTENT}>Content Management</option>
                <option value={PermissionCategory.MODERATION}>Moderation</option>
                <option value={PermissionCategory.USER_MANAGEMENT}>User Management</option>
                <option value={PermissionCategory.SYSTEM}>System</option>
              </select>
              {form.formState.errors.category && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  {isEditing ? 'Updating…' : 'Creating…'}
                </>
              ) : isEditing ? (
                'Update Permission'
              ) : (
                'Create Permission'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
