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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { CustomFieldType } from '@orm'

interface RangeConfigProps {
  rangeMin?: number
  rangeMax?: number
  rangeUnit?: string
  rangeDecimals?: number
  defaultValue?: number | null
  errors?: {
    rangeMin?: string
    rangeMax?: string
    rangeUnit?: string
    rangeDecimals?: string
    defaultValue?: string
  }
  onChange: (field: string, value: string | number | null) => void
}

export function RangeFieldConfig({
  rangeMin = 0,
  rangeMax = 100,
  rangeUnit = '',
  rangeDecimals = 0,
  defaultValue,
  errors = {},
  onChange,
}: RangeConfigProps) {
  return (
    <div className="space-y-4 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
      <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Range Configuration</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Value <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="any"
            value={rangeMin}
            onChange={(e) => onChange('rangeMin', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className={errors.rangeMin ? 'border-red-300 dark:border-red-600' : ''}
          />
          {errors.rangeMin && <p className="text-red-500 text-xs mt-1">{errors.rangeMin}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Value <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="any"
            value={rangeMax}
            onChange={(e) => onChange('rangeMax', parseFloat(e.target.value) || 100)}
            placeholder="100"
            className={errors.rangeMax ? 'border-red-300 dark:border-red-600' : ''}
          />
          {errors.rangeMax && <p className="text-red-500 text-xs mt-1">{errors.rangeMax}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unit (Optional)
          </label>
          <Input
            type="text"
            value={rangeUnit}
            onChange={(e) => onChange('rangeUnit', e.target.value)}
            placeholder="e.g., %, GB, MB"
            maxLength={10}
            className={errors.rangeUnit ? 'border-red-300 dark:border-red-600' : ''}
          />
          {errors.rangeUnit && <p className="text-red-500 text-xs mt-1">{errors.rangeUnit}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Decimal Places
          </label>
          <Input
            type="number"
            value={rangeDecimals}
            onChange={(e) => onChange('rangeDecimals', parseInt(e.target.value) || 0)}
            min={0}
            max={5}
            className={errors.rangeDecimals ? 'border-red-300 dark:border-red-600' : ''}
          />
          {errors.rangeDecimals && (
            <p className="text-red-500 text-xs mt-1">{errors.rangeDecimals}</p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Default Value (Optional)
        </label>
        <Input
          type="number"
          step="any"
          value={defaultValue === null || defaultValue === undefined ? '' : defaultValue}
          onChange={(e) =>
            onChange('defaultValue', e.target.value === '' ? null : parseFloat(e.target.value))
          }
          placeholder={`e.g., ${(rangeMin + rangeMax) / 2}`}
          className={errors.defaultValue ? 'border-red-300 dark:border-red-600' : ''}
        />
        {errors.defaultValue && <p className="text-red-500 text-xs mt-1">{errors.defaultValue}</p>}
      </div>
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SortableOptionItemProps {
  option: SelectOption
  index: number
  errors?: { [key: string]: string }
  onUpdate: (index: number, field: 'value' | 'label', value: string) => void
  onRemove: (index: number) => void
}

function SortableOptionItem({
  option,
  index,
  errors = {},
  onUpdate,
  onRemove,
}: SortableOptionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `option-${index}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2">
      <button
        type="button"
        className="flex items-center justify-center w-8 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <Input
        type="text"
        value={option.value}
        onChange={(e) => onUpdate(index, 'value', e.target.value)}
        placeholder="Value"
        className={errors[`option-${index}-value`] ? 'border-red-300 dark:border-red-600' : ''}
      />
      <Input
        type="text"
        value={option.label}
        onChange={(e) => onUpdate(index, 'label', e.target.value)}
        placeholder="Display Label"
        className={errors[`option-${index}-label`] ? 'border-red-300 dark:border-red-600' : ''}
      />
      <Button type="button" variant="destructive" size="sm" onClick={() => onRemove(index)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface SelectFieldOptionsProps {
  options: SelectOption[]
  errors?: { [key: string]: string }
  onAddOption: () => void
  onRemoveOption: (index: number) => void
  onUpdateOption: (index: number, field: 'value' | 'label', value: string) => void
  onReorderOptions: (newOptions: SelectOption[]) => void
  maxOptions?: number
}

export function SelectFieldOptions({
  options,
  errors = {},
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onReorderOptions,
  maxOptions = 50,
}: SelectFieldOptionsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('option-', ''))
      const newIndex = parseInt(String(over.id).replace('option-', ''))

      const newOptions = arrayMove(options, oldIndex, newIndex)
      onReorderOptions(newOptions)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-md dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Options</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddOption}
          disabled={options.length >= maxOptions}
        >
          Add Option
        </Button>
      </div>
      {options.length === 0 && (
        <p className="text-sm text-gray-500 italic">Add at least one option for the dropdown</p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={options.map((_, index) => `option-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {options.map((option, index) => (
              <SortableOptionItem
                key={`option-${index}`}
                option={option}
                index={index}
                errors={errors}
                onUpdate={onUpdateOption}
                onRemove={onRemoveOption}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {Object.keys(errors)
        .filter((key) => key.startsWith('option-'))
        .map((key) => (
          <p key={key} className="text-red-500 text-xs">
            {errors[key]}
          </p>
        ))}
    </div>
  )
}

interface DefaultValueSelectorProps {
  fieldType: CustomFieldType
  defaultValue: string | boolean | number | null | undefined
  options?: SelectOption[]
  onChange: (value: string | boolean | number | null) => void
  error?: string
}

export function DefaultValueSelector({
  fieldType,
  defaultValue,
  options = [],
  onChange,
  error,
}: DefaultValueSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Default Value (Optional)</label>
      {fieldType === CustomFieldType.TEXT && (
        <Input
          type="text"
          value={defaultValue === null ? '' : String(defaultValue)}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
          placeholder="Default text value"
          maxLength={500}
        />
      )}
      {fieldType === CustomFieldType.BOOLEAN && (
        <Input
          as="select"
          value={defaultValue === null || defaultValue === undefined ? '' : String(defaultValue)}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}
        >
          <option value="">No default</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </Input>
      )}
      {fieldType === CustomFieldType.SELECT && options.length > 0 && (
        <Input
          as="select"
          value={defaultValue === null ? '' : String(defaultValue)}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        >
          <option value="">No default</option>
          {options
            .filter((opt) => opt.value.trim() && opt.label.trim())
            .map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
        </Input>
      )}
      {fieldType === CustomFieldType.SELECT && options.length === 0 && (
        <p className="text-sm text-gray-500 italic">Add options first to set a default value</p>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export const FIELD_TYPE_OPTIONS = [
  { value: CustomFieldType.TEXT, label: 'Text' },
  { value: CustomFieldType.TEXTAREA, label: 'Long Text' },
  { value: CustomFieldType.URL, label: 'URL' },
  { value: CustomFieldType.BOOLEAN, label: 'Yes/No' },
  { value: CustomFieldType.SELECT, label: 'Dropdown' },
  { value: CustomFieldType.RANGE, label: 'Range (Slider)' },
]
