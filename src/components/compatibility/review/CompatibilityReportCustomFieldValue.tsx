'use client'

import { isNumber } from 'remeda'
import { Badge } from '@/components/ui'
import { DRIVER_VERSION_FIELD_NAME } from '@/constants/customFields'
import { CustomFieldType } from '@orm'
import { type FieldValueLike } from './reviewItem'

interface Props {
  fieldValue: FieldValueLike
}

interface SelectOption {
  value: string
  label: string
}

function isSelectOption(value: unknown): value is SelectOption {
  if (typeof value !== 'object' || value === null) return false
  if (!('value' in value) || !('label' in value)) return false
  return typeof value.value === 'string' && typeof value.label === 'string'
}

function getSelectOptions(value: unknown): SelectOption[] {
  if (!Array.isArray(value)) return []
  return value.filter(isSelectOption)
}

function formatDriverVersion(value: string): string {
  if (value.includes('|||')) {
    const [displayValue] = value.split('|||')
    return displayValue ?? value
  }

  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null) return value
    if ('display' in parsed && typeof parsed.display === 'string') return parsed.display
    if ('release' in parsed && typeof parsed.release === 'string') return parsed.release
    return 'Custom Driver'
  } catch {
    return value
  }
}

export function CompatibilityReportCustomFieldValue(props: Props) {
  switch (props.fieldValue.customFieldDefinition.type) {
    case CustomFieldType.BOOLEAN:
      return (
        <Badge variant={props.fieldValue.value ? 'success' : 'default'}>
          {props.fieldValue.value ? 'Yes' : 'No'}
        </Badge>
      )

    case CustomFieldType.SELECT: {
      const option = getSelectOptions(props.fieldValue.customFieldDefinition.options).find(
        (selectOption) => selectOption.value === String(props.fieldValue.value),
      )
      return option?.label ?? String(props.fieldValue.value)
    }

    case CustomFieldType.RANGE: {
      if (isNumber(props.fieldValue.value)) {
        const decimals = props.fieldValue.customFieldDefinition.rangeDecimals ?? 0
        const unit = props.fieldValue.customFieldDefinition.rangeUnit ?? ''
        const formatted =
          decimals > 0
            ? props.fieldValue.value.toFixed(decimals)
            : Math.round(props.fieldValue.value).toString()
        return (
          <Badge>
            {formatted}
            {unit}
          </Badge>
        )
      }
      return String(props.fieldValue.value ?? '')
    }

    case CustomFieldType.URL: {
      if (typeof props.fieldValue.value === 'string' && props.fieldValue.value.trim()) {
        return (
          <a
            href={props.fieldValue.value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block max-w-full text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {props.fieldValue.value}
          </a>
        )
      }
      return String(props.fieldValue.value)
    }

    case CustomFieldType.TEXT: {
      const value = String(props.fieldValue.value ?? '')

      if (props.fieldValue.customFieldDefinition.name === DRIVER_VERSION_FIELD_NAME) {
        return formatDriverVersion(value)
      }

      const isSingleWord = !value.includes(' ') && value.length > 0
      const isShortWord = value.length <= 20

      if (isSingleWord && isShortWord) {
        return (
          <Badge variant="default" className="font-normal">
            {value}
          </Badge>
        )
      }

      return value
    }

    case CustomFieldType.TEXTAREA:
    default: {
      const textValue = String(props.fieldValue.value ?? '')
      return <span className="whitespace-pre-wrap">{textValue}</span>
    }
  }
}
