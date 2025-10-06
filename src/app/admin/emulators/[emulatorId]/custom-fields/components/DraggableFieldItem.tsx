'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Button, Badge, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import getErrorMessage from '@/utils/getErrorMessage'
import { type CustomFieldDefinition, CustomFieldType } from '@orm'

interface Props {
  field: CustomFieldDefinition
  onEdit: (fieldId: string) => void
  onDelete: (fieldId: string) => void
}

export default function DraggableFieldItem(props: Props) {
  const confirm = useConfirmDialog()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const deleteMutation = api.customFieldDefinitions.delete.useMutation({
    onSuccess: () => {
      toast.success('Field deleted successfully')
      props.onDelete(props.field.id)
    },
    onError: (error) => {
      toast.error(`Failed to delete field: ${getErrorMessage(error)}`)
    },
  })

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Delete Custom Field',
      description: `Are you sure you want to delete "${props.field.label}"? This action cannot be undone.`,
      confirmText: 'Delete',
    })

    if (!confirmed) return
    deleteMutation.mutate({ id: props.field.id })
  }

  const typeColors: Record<CustomFieldType, string> = {
    [CustomFieldType.TEXT]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
    [CustomFieldType.TEXTAREA]:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
    [CustomFieldType.URL]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    [CustomFieldType.BOOLEAN]:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
    [CustomFieldType.SELECT]: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
    [CustomFieldType.RANGE]:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  }

  const typeLabels: Record<CustomFieldType, string> = {
    [CustomFieldType.TEXT]: 'Text',
    [CustomFieldType.TEXTAREA]: 'Long Text',
    [CustomFieldType.URL]: 'URL',
    [CustomFieldType.BOOLEAN]: 'Yes/No',
    [CustomFieldType.SELECT]: 'Dropdown',
    [CustomFieldType.RANGE]: 'Range',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg border transition-all',
        'bg-white dark:bg-gray-900',
        isDragging
          ? 'opacity-20 pointer-events-none'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md',
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
      </button>

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{props.field.label}</h4>
          {props.field.isRequired && (
            <Badge variant="default" size="sm" className="bg-red-500 text-white flex-shrink-0">
              Required
            </Badge>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-2 text-sm">
          <code className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded break-all">
            {props.field.name}
          </code>
          <Badge className={cn('text-xs flex-shrink-0', typeColors[props.field.type])}>
            {typeLabels[props.field.type]}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => props.onEdit(props.field.id)}
          aria-label={`Edit ${props.field.label}`}
          className="h-7 w-7 p-0"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          aria-label={`Delete ${props.field.label}`}
          className="h-7 w-7 p-0"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        </Button>
      </div>
    </div>
  )
}
