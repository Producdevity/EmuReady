'use client'

import CustomFieldTypeSelect from '@/app/listings/new/components/custom-fields/CustomFieldTypeSelect'
import CustomFieldTypeText from '@/app/listings/new/components/custom-fields/CustomFieldTypeText'
import CustomFieldTypeTextArea from '@/app/listings/new/components/custom-fields/CustomFieldTypeTextArea'
import CustomFieldTypeBoolean from '@/app/listings/new/components/custom-fields/CustomFieldTypeBoolean'
import { type Control } from 'react-hook-form'
import { isEmpty, isString } from 'remeda'
import { CustomFieldType } from '@orm'
import { type RouterInput } from '@/types/trpc'
import getCustomFieldTypeIcon from '../utils/getCustomFieldTypeIcon'

type ListingFormValues = RouterInput['listings']['create']

interface CustomFieldOptionUI {
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
}

interface Props {
  fieldDef: CustomFieldDefinitionWithOptions
  index: number
  control: Control<ListingFormValues>
  errorMessage: string | undefined
}
export interface ValidationRules {
  required: string | boolean
  validate?: (value: unknown) => boolean | string
}

function CustomFieldRenderer(props: Props) {
  const fieldName = `customFieldValues.${props.index}.value` as const

  function getValidationRules(): ValidationRules {
    return {
      required: props.fieldDef.isRequired
        ? `${props.fieldDef.label} is required`
        : false,
      validate: props.fieldDef.isRequired
        ? (value: unknown) => {
            // Boolean fields are always valid
            if (props.fieldDef.type === CustomFieldType.BOOLEAN) return true

            return !value ||
              (isString(value) && value.trim() === '') ||
              isEmpty(value)
              ? `${props.fieldDef.label} is required`
              : true
          }
        : undefined,
    }
  }

  const icon = getCustomFieldTypeIcon(props.fieldDef.type)
  const validationRules = getValidationRules()

  switch (props.fieldDef.type) {
    case CustomFieldType.TEXT:
    case CustomFieldType.URL:
      return (
        <CustomFieldTypeText
          fieldDef={props.fieldDef}
          fieldName={fieldName}
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
          fieldName={fieldName}
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
          fieldName={fieldName}
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
          fieldName={fieldName}
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

export default CustomFieldRenderer
