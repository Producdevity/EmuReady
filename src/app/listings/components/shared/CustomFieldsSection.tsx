'use client'

import { isNullish } from 'remeda'
import {
  CustomFieldValue,
  type FieldValueLike,
} from '@/app/listings/components/shared/CustomFieldValue'
import { cn } from '@/lib/utils'

interface Props {
  title?: string
  fieldValues: (FieldValueLike & { id: string })[]
  alignItems?: 'start' | 'center'
}

export function CustomFieldsSection(props: Props) {
  const title = props.title ?? 'Emulator-Specific Details'
  const alignItems = props.alignItems ?? 'start'
  const hasFields = Array.isArray(props.fieldValues) && props.fieldValues.length > 0
  if (!hasFields) return null

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">{title}</h2>
      <div className="space-y-3">
        {props.fieldValues
          .filter((fv) => !isNullish(fv.value) && fv.value !== '')
          .map((fieldValue) => (
            <div key={fieldValue.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div
                className={cn(
                  'flex flex-col sm:flex-row gap-2',
                  alignItems === 'center' ? 'sm:items-center' : 'sm:items-start',
                )}
              >
                <span className="font-medium text-gray-700 dark:text-gray-300 sm:min-w-[120px] sm:flex-shrink-0">
                  {fieldValue.customFieldDefinition.label}:
                </span>
                <span className="text-gray-600 dark:text-gray-400 break-words overflow-wrap-anywhere min-w-0 flex-1">
                  <CustomFieldValue fieldValue={fieldValue} />
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
