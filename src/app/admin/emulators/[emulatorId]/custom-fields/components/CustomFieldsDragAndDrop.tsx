'use client'

import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { PlusCircle, GripVertical } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { type CustomFieldDefinition, type CustomFieldCategory } from '@orm'
import CategoryFormModal from './CategoryFormModal'
import DroppableCategoryZone from './DroppableCategoryZone'

type CustomFieldWithCategory = CustomFieldDefinition & {
  category: CustomFieldCategory | null
}

interface Props {
  emulatorId: string
  fields: CustomFieldWithCategory[]
  categories: (CustomFieldCategory & { fields: CustomFieldDefinition[] })[]
  onFieldEdit: (fieldId: string) => void
  onFieldDelete: (fieldId: string) => void
  onRefresh: () => void
}

const DRAG_ACTIVATION_DISTANCE = 3

/**
 * Check if two fields are in the same category (including both being uncategorized)
 */
function areFieldsInSameCategory(
  fieldCategoryId: string | null,
  otherFieldCategoryId: string | null,
): boolean {
  return (
    fieldCategoryId === otherFieldCategoryId ||
    (fieldCategoryId === null && otherFieldCategoryId === null)
  )
}

export default function CustomFieldsDragAndDrop(props: Props) {
  const utils = api.useUtils()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [localFields, setLocalFields] = useState<CustomFieldWithCategory[]>([])
  const [localCategories, setLocalCategories] = useState<CustomFieldCategory[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_ACTIVATION_DISTANCE,
      },
    }),
    useSensor(KeyboardSensor),
  )

  // Use local fields if we have them, otherwise use props
  const displayFields = localFields.length > 0 ? localFields : props.fields

  // Organize fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, CustomFieldWithCategory[]> = {
      uncategorized: [],
    }

    props.categories.forEach((cat) => {
      grouped[cat.id] = []
    })

    displayFields.forEach((field) => {
      const categoryId = field.categoryId || 'uncategorized'
      if (!grouped[categoryId]) {
        grouped[categoryId] = []
      }
      grouped[categoryId].push(field)
    })

    // Sort fields within each category by categoryOrder
    Object.keys(grouped).forEach((catId) => {
      grouped[catId].sort((a, b) => a.categoryOrder - b.categoryOrder)
    })

    return grouped
  }, [displayFields, props.categories])

  // Use local categories if we have them, otherwise use props
  const displayCategories = localCategories.length > 0 ? localCategories : props.categories

  // Sort categories by displayOrder
  const sortedCategories = useMemo(() => {
    return [...displayCategories].sort((a, b) => a.displayOrder - b.displayOrder)
  }, [displayCategories])

  const updateFieldMutation = api.customFieldDefinitions.update.useMutation({
    onSuccess: async () => {
      // Invalidate queries and wait for refetch to complete
      await Promise.all([
        utils.customFieldDefinitions.getByEmulator.invalidate({ emulatorId: props.emulatorId }),
        utils.customFieldCategories.getByEmulator.invalidate({ emulatorId: props.emulatorId }),
      ])

      // Only clear local state after queries have refetched
      setLocalFields([])
      props.onRefresh()
    },
    onError: (error) => {
      // Rollback to server state on error
      setLocalFields([])
      toast.error(`Failed to update field: ${getErrorMessage(error)}`)
    },
  })

  const updateCategoryOrderMutation = api.customFieldCategories.updateOrder.useMutation({
    onSuccess: async () => {
      await utils.customFieldCategories.getByEmulator.invalidate({ emulatorId: props.emulatorId })
      setLocalCategories([])
      toast.success('Category order updated')
    },
    onError: (error) => {
      setLocalCategories([])
      toast.error(`Failed to update category order: ${getErrorMessage(error)}`)
    },
  })

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    setActiveId(id)
  }

  function handleDragOver(_event: DragOverEvent) {
    // Allow dragging to happen
    return
  }

  function handleCategoryDragEnd(activeId: string, overId: string) {
    // Check if over another category
    if (!overId.startsWith('category-')) return

    const activeCategory = sortedCategories.find((c) => `category-${c.id}` === activeId)
    const overCategory = sortedCategories.find((c) => `category-${c.id}` === overId)

    if (!activeCategory || !overCategory) return
    if (activeCategory.id === overCategory.id) return

    // Find indices in sorted array
    const oldIndex = sortedCategories.findIndex((c) => c.id === activeCategory.id)
    const newIndex = sortedCategories.findIndex((c) => c.id === overCategory.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder categories
    const reordered = arrayMove(sortedCategories, oldIndex, newIndex)

    // Optimistically update local state with new displayOrder
    const reorderedWithDisplayOrder = reordered.map((cat, index) => ({
      ...cat,
      displayOrder: index,
    }))
    setLocalCategories(reorderedWithDisplayOrder)

    // Update displayOrder for all categories on server
    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      displayOrder: index,
    }))

    updateCategoryOrderMutation.mutate(updates)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if we're dragging a category
    if (activeId.startsWith('category-')) {
      handleCategoryDragEnd(activeId, overId)
      return
    }

    // Otherwise, we're dragging a field
    const activeField = props.fields.find((f) => f.id === activeId)
    if (!activeField) return

    // Check if dropped on a category drop zone
    if (overId.startsWith('category-dropzone-')) {
      const targetCategoryId = overId.replace('category-dropzone-', '')
      const newCategoryId = targetCategoryId === 'uncategorized' ? null : targetCategoryId

      // Only update if category changed
      if (activeField.categoryId !== newCategoryId) {
        // Find the highest categoryOrder in the target category
        const targetFields = fieldsByCategory[targetCategoryId] || []
        const maxOrder = targetFields.reduce((max, f) => Math.max(max, f.categoryOrder), -1)
        const newOrder = maxOrder + 1

        // Optimistically update local state immediately
        setLocalFields(
          props.fields.map((f) =>
            f.id === activeField.id
              ? { ...f, categoryId: newCategoryId, categoryOrder: newOrder }
              : f,
          ),
        )

        // Send update to server
        updateFieldMutation.mutate({
          id: activeField.id,
          categoryId: newCategoryId,
          categoryOrder: newOrder,
        })
      }
      return
    }

    // Check if dropped on a field
    const overField = props.fields.find((f) => f.id === overId)
    if (!overField) return

    // If fields are in the same category, reorder within that category
    if (activeField.categoryId === overField.categoryId) {
      const categoryId = activeField.categoryId || 'uncategorized'
      const fieldsInCategory = fieldsByCategory[categoryId] || []
      const oldIndex = fieldsInCategory.findIndex((f) => f.id === activeId)
      const targetIndex = fieldsInCategory.findIndex((f) => f.id === overId)

      if (oldIndex !== targetIndex && oldIndex !== -1 && targetIndex !== -1) {
        // Reorder the fields array
        const reordered = arrayMove(fieldsInCategory, oldIndex, targetIndex)

        // Optimistically update all fields in this category with their new order
        setLocalFields(
          props.fields.map((f) => {
            if (!areFieldsInSameCategory(f.categoryId, activeField.categoryId)) return f

            // Find this field's new position in the reordered array
            const newPosition = reordered.findIndex((rf) => rf.id === f.id)
            if (newPosition !== -1) {
              return { ...f, categoryOrder: newPosition }
            }
            return f
          }),
        )

        // Send update to server - just update the dragged field
        // The server will see the new categoryOrder and the UI already shows the change
        updateFieldMutation.mutate({
          id: activeField.id,
          categoryOrder: targetIndex,
        })
      }
    } else {
      // Fields are in different categories - move the field to the target category
      const newCategoryId = overField.categoryId
      const targetCategoryKey = newCategoryId || 'uncategorized'
      const targetFields = fieldsByCategory[targetCategoryKey] || []
      const maxOrder = targetFields.reduce((max, f) => Math.max(max, f.categoryOrder), -1)
      const newOrder = maxOrder + 1

      // Optimistically update local state immediately
      setLocalFields(
        props.fields.map((f) =>
          f.id === activeField.id
            ? { ...f, categoryId: newCategoryId, categoryOrder: newOrder }
            : f,
        ),
      )

      // Send update to server
      updateFieldMutation.mutate({
        id: activeField.id,
        categoryId: newCategoryId,
        categoryOrder: newOrder,
      })
    }
  }

  function handleCategoryModalSuccess() {
    setIsCategoryModalOpen(false)
    props.onRefresh()
  }

  const activeField = activeId ? props.fields.find((f) => f.id === activeId) : null
  const activeCategory = activeId?.startsWith('category-')
    ? sortedCategories.find((c) => `category-${c.id}` === activeId)
    : null

  const isDraggingCategory = activeId?.startsWith('category-') ?? false

  // Only category IDs for parent SortableContext
  const categoryIds = sortedCategories.map((c) => `category-${c.id}`)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* Categories Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h2>
              <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Category
              </Button>
            </div>

            <SortableContext items={categoryIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {sortedCategories.map((category) => {
                  const fieldsInCategory = fieldsByCategory[category.id] || []

                  // Check if we're dragging a field from outside this category
                  const draggingFieldFromOutside = Boolean(
                    activeField && activeField.categoryId !== category.id,
                  )

                  return (
                    <DroppableCategoryZone
                      key={category.id}
                      sortableId={`category-${category.id}`}
                      category={category}
                      fields={fieldsInCategory}
                      emulatorId={props.emulatorId}
                      onFieldEdit={props.onFieldEdit}
                      onFieldDelete={props.onFieldDelete}
                      onRefresh={props.onRefresh}
                      isDraggingCategory={isDraggingCategory}
                      disableFieldSorting={draggingFieldFromOutside}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </div>

          {/* Uncategorized Section */}
          {fieldsByCategory.uncategorized && fieldsByCategory.uncategorized.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Uncategorized Fields
              </h2>
              <DroppableCategoryZone
                category={null}
                fields={fieldsByCategory.uncategorized}
                emulatorId={props.emulatorId}
                onFieldEdit={props.onFieldEdit}
                onFieldDelete={props.onFieldDelete}
                onRefresh={props.onRefresh}
                isDraggingCategory={isDraggingCategory}
                disableFieldSorting={Boolean(activeField && activeField.categoryId !== null)}
              />
            </div>
          )}

          {/* Empty State */}
          {props.fields.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No custom fields defined yet.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Create a custom field to get started.
              </p>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCategory ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-2xl border-2 border-blue-500 dark:border-blue-400 cursor-grabbing opacity-90 min-w-[200px]">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {activeCategory.name}
                </span>
              </div>
            </div>
          ) : activeField ? (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-2xl border-2 border-blue-500 dark:border-blue-400 cursor-grabbing max-w-xs">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-medium truncate">{activeField.label}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {isCategoryModalOpen && (
        <CategoryFormModal
          emulatorId={props.emulatorId}
          categoryToEdit={null}
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSuccess={handleCategoryModalSuccess}
        />
      )}
    </>
  )
}
