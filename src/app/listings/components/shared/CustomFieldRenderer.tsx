'use client'

import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import CustomFieldTypeDriverVersion from '@/app/listings/components/shared/custom-fields/CustomFieldTypeDriverVersion'
import { CustomFieldType } from '@orm'
import {
  CustomFieldTypeBoolean,
  CustomFieldTypeRange,
  CustomFieldTypeSelect,
  CustomFieldTypeText,
  CustomFieldTypeTextArea,
  getCustomFieldTypeIcon,
  isCustomFieldValueEmpty,
} from './index'

export interface CustomFieldOptionUI {
  value: string
  label: string
}

export interface CustomFieldDefinitionWithOptions {
  id: string
  name: string
  label: string
  type: CustomFieldType
  isRequired: boolean
  parsedOptions?: CustomFieldOptionUI[]
  placeholder?: string | null
  rangeMin?: number | null
  rangeMax?: number | null
  rangeUnit?: string | null
  rangeDecimals?: number | null
  defaultValue?: string | number | boolean | null
  categoryId?: string | null
  categoryOrder?: number
  displayOrder?: number
  category?: {
    id: string
    name: string
    displayOrder: number
  } | null
}

export interface ValidationRules {
  required: string | boolean
  validate?: (value: unknown) => boolean | string
}

interface Props<TFieldValues extends FieldValues = FieldValues> {
  fieldDef: CustomFieldDefinitionWithOptions
  fieldName: FieldPath<TFieldValues>
  index: number
  control: Control<TFieldValues>
  errorMessage?: string
}

export const DRIVER_VERSION_FIELD_NAME = 'dynamic_driver_version' as const

export function CustomFieldRenderer<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  function getValidationRules(): ValidationRules {
    return {
      required: props.fieldDef.isRequired ? `${props.fieldDef.label} is required` : false,
      validate: props.fieldDef.isRequired
        ? (value: unknown) => {
            // Boolean fields are always valid
            if (props.fieldDef.type === CustomFieldType.BOOLEAN) return true

            // Check if value is empty
            return isCustomFieldValueEmpty(value) ? `${props.fieldDef.label} is required` : true
          }
        : undefined,
    }
  }

  const icon = getCustomFieldTypeIcon(props.fieldDef.type)
  const validationRules = getValidationRules()

  if (
    props.fieldDef.type === CustomFieldType.TEXT &&
    props.fieldDef.name === DRIVER_VERSION_FIELD_NAME
  ) {
    // Special case for driver version field
    return (
      <CustomFieldTypeDriverVersion
        fieldDef={props.fieldDef}
        fieldName={props.fieldName}
        index={props.index}
        rules={validationRules}
        control={props.control}
        errorMessage={props.errorMessage}
        icon={icon}
      />
    )
  }

  switch (props.fieldDef.type) {
    case CustomFieldType.TEXT:
    case CustomFieldType.URL:
      return (
        <CustomFieldTypeText
          fieldDef={props.fieldDef}
          fieldName={props.fieldName}
          index={props.index}
          rules={validationRules}
          control={props.control}
          errorMessage={props.errorMessage}
          icon={icon}
        />
      )

    case CustomFieldType.TEXTAREA:
      return (
        <CustomFieldTypeTextArea
          fieldDef={props.fieldDef}
          fieldName={props.fieldName}
          index={props.index}
          rules={validationRules}
          control={props.control}
          errorMessage={props.errorMessage}
          icon={icon}
        />
      )

    case CustomFieldType.BOOLEAN:
      return (
        <CustomFieldTypeBoolean
          fieldDef={props.fieldDef}
          fieldName={props.fieldName}
          index={props.index}
          rules={validationRules}
          control={props.control}
          errorMessage={props.errorMessage}
          icon={icon}
        />
      )

    case CustomFieldType.SELECT:
      return (
        <CustomFieldTypeSelect
          fieldDef={props.fieldDef}
          fieldName={props.fieldName}
          index={props.index}
          rules={validationRules}
          control={props.control}
          errorMessage={props.errorMessage}
          icon={icon}
        />
      )

    case CustomFieldType.RANGE:
      return (
        <CustomFieldTypeRange
          fieldDef={props.fieldDef}
          fieldName={props.fieldName}
          index={props.index}
          rules={validationRules}
          control={props.control}
          errorMessage={props.errorMessage}
          icon={icon}
        />
      )

    default:
      return null
  }
}
