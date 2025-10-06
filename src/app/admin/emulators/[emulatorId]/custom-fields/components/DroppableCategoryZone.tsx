'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2, FolderOpen, GripVertical } from 'lucide-react'
import { useState } from 'react'
import { Button, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import getErrorMessage from '@/utils/getErrorMessage'
import { type CustomFieldDefinition, type CustomFieldCategory } from '@orm'
import CategoryFormModal from './CategoryFormModal'
import DraggableFieldItem from './DraggableFieldItem'

interface Props {
  sortableId?: string // For category reordering
  category: CustomFieldCategory | null // null for uncategorized
  fields: CustomFieldDefinition[]
  emulatorId: string
  onFieldEdit: (fieldId: string) => void
  onFieldDelete: (fieldId: string) => void
  onRefresh: () => void
  isDraggingCategory: boolean
  disableFieldSorting?: boolean
}

export default function DroppableCategoryZone(props: Props) {
  const confirm = useConfirmDialog()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const categoryId = props.category?.id || 'uncategorized'
  const dropZoneId = `category-dropzone-${categoryId}`
  const isUncategorized = !props.category

  // Field IDs for nested SortableContext
  const fieldIds = props.fields.map((f) => f.id)

  // Use droppable for field dropping - disabled when dragging categories
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: dropZoneId,
    disabled: props.isDraggingCategory,
  })

  // Use sortable for category reordering (only for actual categories, not uncategorized)
  const sortable = useSortable({
    id: props.sortableId || dropZoneId,
    disabled: isUncategorized, // Don't allow dragging uncategorized section
  })

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = sortable

  // Combine refs
  const combinedRef = (node: HTMLElement | null) => {
    setDroppableRef(node)
    if (!isUncategorized) {
      setSortableRef(node)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const utils = api.useUtils()

  const deleteMutation = api.customFieldCategories.delete.useMutation({
    onSuccess: () => {
      utils.customFieldCategories.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      utils.customFieldDefinitions.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      toast.success('Category deleted. Fields moved to Uncategorized.')
      props.onRefresh()
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${getErrorMessage(error)}`)
    },
  })

  async function handleDelete() {
    if (!props.category) return

    const confirmed = await confirm({
      title: 'Delete Category',
      description: `Are you sure you want to delete "${props.category.name}"? ${
        props.fields.length > 0
          ? `${props.fields.length} field${props.fields.length === 1 ? '' : 's'} will be moved to Uncategorized.`
          : ''
      }`,
      confirmText: 'Delete',
    })

    if (!confirmed) return
    deleteMutation.mutate({ id: props.category.id })
  }

  function handleEditModalSuccess() {
    setIsEditModalOpen(false)
    props.onRefresh()
  }

  return (
    <>
      <div
        ref={combinedRef}
        style={style}
        className={cn(
          'relative rounded-lg border-2 transition-all duration-200 flex flex-col',
          'bg-white dark:bg-gray-800',
          isDragging && 'opacity-30',
          isOver && !isDragging
            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 shadow-lg scale-[1.01] ring-2 ring-blue-200 dark:ring-blue-900'
            : isUncategorized
              ? 'border-dashed border-gray-300 dark:border-gray-700'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          props.fields.length === 0 && !isOver && 'min-h-[160px]',
        )}
      >
        {/* Category Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Drag Handle - only for non-uncategorized */}
            {!isUncategorized && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                aria-label="Drag to reorder category"
              >
                <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
            <FolderOpen className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {props.category?.name || 'Uncategorized'}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full flex-shrink-0">
              {props.fields.length}
            </span>
          </div>

          {!isUncategorized && props.category && (
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                aria-label={`Edit ${props.category.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                aria-label={`Delete ${props.category.name}`}
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          )}
        </div>

        {/* Fields List - conditionally wrapped in SortableContext */}
        {props.disableFieldSorting ? (
          <div className="p-4 space-y-2 min-h-[60px]">
            {props.fields.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {isOver ? 'Drop field here' : 'Drag fields here'}
                </p>
              </div>
            ) : (
              props.fields.map((field) => (
                <DraggableFieldItem
                  key={field.id}
                  field={field}
                  onEdit={props.onFieldEdit}
                  onDelete={props.onFieldDelete}
                />
              ))
            )}
          </div>
        ) : (
          <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
            <div className="p-4 space-y-2 min-h-[60px]">
              {props.fields.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {isOver ? 'Drop field here' : 'Drag fields here'}
                  </p>
                </div>
              ) : (
                props.fields.map((field) => (
                  <DraggableFieldItem
                    key={field.id}
                    field={field}
                    onEdit={props.onFieldEdit}
                    onDelete={props.onFieldDelete}
                  />
                ))
              )}
            </div>
          </SortableContext>
        )}

        {/* Drop Zone Indicator Overlay - Only show for empty categories when dragging fields */}
        {isOver && !props.isDraggingCategory && props.fields.length === 0 && (
          <div className="absolute inset-0 rounded-lg pointer-events-none bg-blue-100/30 dark:bg-blue-900/30 flex items-center justify-center z-10">
            <div className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-2xl text-lg">
              Drop here
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && props.category && (
        <CategoryFormModal
          emulatorId={props.emulatorId}
          categoryToEdit={props.category}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditModalSuccess}
        />
      )}
    </>
  )
}
