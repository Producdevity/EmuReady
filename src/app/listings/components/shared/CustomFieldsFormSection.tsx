'use client'

import { type Control, type FieldErrors, type FieldValues } from 'react-hook-form'
import { isString } from 'remeda'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { sortCustomFieldsByCategory } from '@/utils/sortCustomFields'
import CustomFieldRenderer, { type CustomFieldDefinitionWithOptions } from './CustomFieldRenderer'

interface CustomFieldsFormSectionProps<TFormValues extends FieldValues> {
  parsedCustomFields: CustomFieldDefinitionWithOptions[]
  control: Control<TFormValues>
  errors: FieldErrors<TFormValues>
  emulatorName?: string
  highlightedFieldIds?: string[]
}

export function CustomFieldsFormSection<TFormValues extends FieldValues>(
  props: CustomFieldsFormSectionProps<TFormValues>,
) {
  if (props.parsedCustomFields.length === 0) return null

  const categoryGroups = sortCustomFieldsByCategory(
    props.parsedCustomFields.map((field) => ({
      id: field.id,
      customFieldDefinition: {
        categoryId: field.categoryId,
        categoryOrder: field.categoryOrder,
        displayOrder: field.displayOrder,
        category: field.category,
      },
    })),
  )

  return (
    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        Emulator-Specific Details
        {props.emulatorName && (
          <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
            ({props.emulatorName})
          </span>
        )}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categoryGroups.map((group) => {
          const categoryFields = props.parsedCustomFields.filter(
            (field) =>
              (field.categoryId || 'uncategorized') === group.categoryId &&
              group.fields.some((gf) => gf.id === field.id),
          )

          return (
            <div
              key={group.categoryId}
              className={cn(
                'rounded-lg border p-5 space-y-4',
                'bg-white dark:bg-gray-800/50',
                group.categoryId === 'uncategorized'
                  ? 'border-dashed border-gray-300 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700',
              )}
            >
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {group.categoryName}
                </h3>
                <Badge variant="default" size="sm" className="ml-auto">
                  {group.fields.length}
                </Badge>
              </div>

              <div className="space-y-4">
                {categoryFields.map((fieldDef) => {
                  const index = props.parsedCustomFields.findIndex((f) => f.id === fieldDef.id)

                  const customFieldErrors = props.errors.customFieldValues as
                    | { value?: { message?: string } }[]
                    | undefined

                  const errorMessage = isString(customFieldErrors?.[index]?.value?.message)
                    ? customFieldErrors[index]?.value?.message
                    : undefined

                  const isHighlighted = props.highlightedFieldIds?.includes(fieldDef.id)

                  return (
                    <div
                      key={fieldDef.id}
                      className={cn(
                        'rounded-lg border border-gray-200/60 p-3 transition dark:border-gray-700/60',
                        isHighlighted &&
                          'border-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/20',
                      )}
                    >
                      <CustomFieldRenderer
                        fieldDef={fieldDef}
                        fieldName={`customFieldValues.${index}.value` as never}
                        index={index}
                        control={props.control}
                        errorMessage={errorMessage}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
