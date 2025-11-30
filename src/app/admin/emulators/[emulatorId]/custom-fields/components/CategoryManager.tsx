'use client'

import { Pencil, Trash2, PlusCircle, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, LoadingSpinner, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { formatCountLabel } from '@/utils/text'
import CategoryFormModal from './CategoryFormModal'

interface CategoryManagerProps {
  emulatorId: string
}

export default function CategoryManager(props: CategoryManagerProps) {
  const confirm = useConfirmDialog()
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

  const categoriesQuery = api.customFieldCategories.getByEmulator.useQuery(
    { emulatorId: props.emulatorId },
    { enabled: !!props.emulatorId },
  )

  const utils = api.useUtils()

  const deleteMutation = api.customFieldCategories.delete.useMutation({
    onSuccess: () => {
      utils.customFieldCategories.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      utils.customFieldDefinitions.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      toast.success('Category deleted successfully! Fields have been moved to Uncategorized.')
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${getErrorMessage(error)}`)
    },
  })

  function handleOpenCreateModal() {
    setEditingCategoryId(null)
    setIsFormModalOpen(true)
  }

  function handleOpenEditModal(categoryId: string) {
    setEditingCategoryId(categoryId)
    setIsFormModalOpen(true)
  }

  function handleCloseModal() {
    setIsFormModalOpen(false)
    setEditingCategoryId(null)
  }

  function handleModalSuccess() {
    void categoriesQuery.refetch()
  }

  async function handleDelete(categoryId: string, categoryName: string, fieldCount: number) {
    const confirmed = await confirm({
      title: 'Delete Category',
      description: `Are you sure you want to delete the category "${categoryName}"? ${
        fieldCount > 0
          ? `${formatCountLabel('field', fieldCount)} will be moved to Uncategorized.`
          : 'This action cannot be undone.'
      }`,
      confirmText: 'Delete',
    })

    if (!confirmed) return

    deleteMutation.mutate({ id: categoryId })
  }

  if (categoriesQuery.isPending) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner text="Loading categories…" />
      </div>
    )
  }

  if (categoriesQuery.error) {
    return (
      <Card className="p-8">
        <p className="text-red-600 dark:text-red-400 text-center">
          Failed to load categories: {getErrorMessage(categoriesQuery.error)}
        </p>
      </Card>
    )
  }

  const categories = categoriesQuery.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categories</h2>
        <Button onClick={handleOpenCreateModal} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No categories defined yet.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Create categories to organize custom fields into logical groups.
            </p>
            <Button onClick={handleOpenCreateModal} variant="primary">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Category
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const fieldCount = category.fields?.length ?? 0
            return (
              <Card
                key={category.id}
                className="p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(category.id)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id, category.name, fieldCount)}
                      disabled={deleteMutation.isPending}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>

                {fieldCount > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Fields in this category
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {category.fields?.slice(0, 3).map((field) => (
                        <span
                          key={field.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {field.label}
                        </span>
                      ))}
                      {fieldCount > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          +{fieldCount - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {isFormModalOpen && (
        <CategoryFormModal
          emulatorId={props.emulatorId}
          categoryToEdit={
            editingCategoryId ? categories.find((c) => c.id === editingCategoryId) : null
          }
          isOpen={isFormModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
