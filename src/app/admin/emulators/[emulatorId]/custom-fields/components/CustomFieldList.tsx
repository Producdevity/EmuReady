'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { GripVertical, X, Check, Undo } from 'lucide-react'
import { useState, useEffect, type ReactNode } from 'react'
import { Button, Badge, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type Maybe } from '@/types/utils'
import getErrorMessage from '@/utils/getErrorMessage'
import { type CustomFieldDefinition, type Prisma } from '@orm'
import CustomFieldSortableRow from './CustomFieldSortableRow'

interface CustomFieldOptionUI {
  value: string
  label: string
}

interface CustomFieldListProps {
  customFields: CustomFieldDefinition[]
  onEdit: (fieldId: string) => void
  onDeleteSuccess: () => void
  emulatorId: string
}

function CustomFieldList(props: CustomFieldListProps) {
  const utils = api.useUtils()
  const confirm = useConfirmDialog()
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [orderedFields, setOrderedFields] = useState<CustomFieldDefinition[]>(() => {
    const fields = props.customFields ?? []
    return [...fields].sort((a, b) => a.displayOrder - b.displayOrder)
  })
  const [previousOrder, setPreviousOrder] = useState<CustomFieldDefinition[]>([])
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    // Keep local state in sync if initialCustomFields prop changes and not in reorder mode or dirty
    if (!isReorderMode && !isDirty) {
      const fields = props.customFields ?? []
      const sortedInitialFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder)
      setOrderedFields(sortedInitialFields)
      // Ensure previousOrder is also in sync when not dirty and not in reorder mode
      setPreviousOrder(sortedInitialFields)
    }
  }, [props.customFields, isReorderMode, isDirty])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const updateOrderMutation = api.customFieldDefinitions.updateOrder.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .then(() => toast.success('Order updated successfully!'))

      setIsDirty(false) // Reset dirty state on successful save
    },
    onError: (error) => {
      console.error('Error updating order:', error)
      toast.error(`Error updating order: ${getErrorMessage(error)}`)
      setOrderedFields(previousOrder)
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id && over) {
      // Ensure over is not null
      setOrderedFields((items) => {
        // Store current order before changing if not already dirty (i.e., first drag)
        if (!isDirty) {
          setPreviousOrder([...items])
        }
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        setIsDirty(true) // Mark as dirty, needs save or cancel
        return newItems
      })
    }
  }

  const handleConfirmReorder = () => {
    const payload = orderedFields.map((item, index) => ({
      id: item.id,
      displayOrder: index,
    }))
    updateOrderMutation.mutate(payload)
    // isDirty will be set to false in onSuccess of the mutation
  }

  const handleCancelReorder = () => {
    setOrderedFields(previousOrder) // Revert to the order before drag started
    setIsDirty(false)
  }

  const toggleReorderMode = () => {
    if (isReorderMode && isDirty) {
      // If exiting reorder mode with unsaved changes, revert them
      // and reset dirty state.
      const fields = props.customFields ?? []
      const sortedInitialFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder)
      setOrderedFields(sortedInitialFields)
      setPreviousOrder(sortedInitialFields) // also reset previousOrder to initial
      setIsDirty(false)
    }
    setIsReorderMode(!isReorderMode)
    // If entering reorder mode, ensure previousOrder is set to current display order
    if (!isReorderMode) {
      setPreviousOrder([...orderedFields])
    }
  }

  const deleteCustomField = api.customFieldDefinitions.delete.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .then(() => toast.success('Custom field deleted successfully!'))
      props.onDeleteSuccess()
    },
    onError: (error) => {
      console.error('Error deleting custom field:', error)
      toast.error(`Error deleting custom field: ${getErrorMessage(error)}`)
    },
  })

  const handleDelete = async (fieldId: string) => {
    const confirmed = await confirm({
      title: 'Delete Custom Field',
      description: 'Are you sure you want to delete this custom field?',
    })

    if (!confirmed) return

    deleteCustomField.mutate({ id: fieldId })
  }

  const renderOptionsPreview = (optionsAsJson: Maybe<Prisma.JsonValue>): ReactNode => {
    if (!Array.isArray(optionsAsJson)) {
      return <span className="text-gray-500 italic">N/A</span>
    }

    const validOptions: CustomFieldOptionUI[] = []
    for (const item of optionsAsJson) {
      if (typeof item === 'object' && item !== null && 'value' in item && 'label' in item) {
        const val = (item as { value?: unknown }).value
        const lbl = (item as { label?: unknown }).label
        if (typeof val === 'string' && typeof lbl === 'string') {
          validOptions.push({ value: val, label: lbl })
        }
      }
    }

    if (validOptions.length === 0) {
      return <span className="text-gray-500 italic">N/A</span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {validOptions.slice(0, 3).map((opt, index) => (
          <Badge key={index} variant="default">
            {opt.label ?? opt.value ?? 'Invalid Option'}
          </Badge>
        ))}
        {validOptions.length > 3 && (
          <Badge variant="default">+ {validOptions.length - 3} more</Badge>
        )}
      </div>
    )
  }

  if (!props.customFields || props.customFields.length === 0) {
    return <p>No custom fields defined for this emulator yet.</p>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex justify-end mb-4 space-x-2">
        {isReorderMode && isDirty && (
          <>
            <Button variant="outline" onClick={handleCancelReorder} size="sm">
              <Undo className="mr-2 h-4 w-4" /> Cancel Changes
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmReorder}
              size="sm"
              isLoading={updateOrderMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" /> Confirm Order
            </Button>
          </>
        )}
        <Button variant="outline" onClick={toggleReorderMode} size="sm">
          {isReorderMode ? (
            <>
              <X className="mr-2 h-4 w-4" /> Finish Reordering
            </>
          ) : (
            <>
              <GripVertical className="mr-2 h-4 w-4" /> Reorder Fields
            </>
          )}
        </Button>
      </div>
      <SortableContext
        items={orderedFields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {isReorderMode && <th scope="col" className="px-2 py-3" />}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Display Label
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Internal Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Required
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Options (Preview)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Order
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {orderedFields.map((field) => (
                <CustomFieldSortableRow
                  key={field.id}
                  field={field}
                  onEdit={props.onEdit}
                  handleDelete={handleDelete}
                  isReorderMode={isReorderMode}
                  renderOptionsPreview={renderOptionsPreview}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default CustomFieldList
