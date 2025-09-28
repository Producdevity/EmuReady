'use client'

import { isNullish } from 'remeda'
import {
  CustomFieldValue,
  type FieldValueLike,
} from '@/app/listings/components/shared/CustomFieldValue'
import { DetailFieldRow } from '@/app/listings/components/shared/details/DetailFieldRow'

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
            <div
              key={fieldValue.id}
              className="w-full max-w-full rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-800/80 overflow-hidden"
            >
              <dl>
                <DetailFieldRow
                  align={alignItems}
                  label={fieldValue.customFieldDefinition.label ?? 'Field'}
                  value={
                    <span className="block break-words overflow-wrap-anywhere">
                      <CustomFieldValue fieldValue={fieldValue} />
                    </span>
                  }
                />
              </dl>
            </div>
          ))}
      </div>
    </div>
  )
}
