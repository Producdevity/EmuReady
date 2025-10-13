'use client'

import { isNumber } from 'remeda'
import { DRIVER_VERSION_FIELD_NAME } from '@/app/listings/components/shared/CustomFieldRenderer'
import { Badge } from '@/components/ui'
import { CustomFieldType } from '@orm'

export interface FieldValueLike {
  value: unknown
  customFieldDefinition: {
    type: CustomFieldType
    label?: string
    name?: string | null
    options?: unknown
    defaultValue?: unknown
    rangeDecimals?: number | null
    rangeUnit?: string | null
    categoryId?: string | null
    category?: { id: string; name: string } | null
  }
}

interface Props {
  fieldValue: FieldValueLike
}
export function CustomFieldValue(props: Props) {
  switch (props.fieldValue.customFieldDefinition.type) {
    case CustomFieldType.BOOLEAN:
      return (
        <Badge variant={props.fieldValue.value ? 'success' : 'default'}>
          {props.fieldValue.value ? 'Yes' : 'No'}
        </Badge>
      )

    case CustomFieldType.SELECT: {
      const opts = (props.fieldValue.customFieldDefinition.options || []) as {
        value: string
        label: string
      }[]
      const option = opts.find((opt) => opt.value === String(props.fieldValue.value))
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
      const valueStr = String(props.fieldValue.value ?? '')

      if (props.fieldValue.customFieldDefinition.name === DRIVER_VERSION_FIELD_NAME) {
        let displayValue = valueStr
        if (valueStr.includes('|||')) {
          ;[displayValue] = valueStr.split('|||')
        } else {
          try {
            const parsed = JSON.parse(valueStr)
            if (parsed && typeof parsed === 'object') {
              displayValue = parsed.display || parsed.release || 'Custom Driver'
            }
          } catch {
            // Not JSON, use as-is
          }
        }

        return displayValue
      }

      // For regular text: use badge style for short single words, plain text for longer content
      const isSingleWord = !valueStr.includes(' ') && valueStr.length > 0
      const isShortWord = valueStr.length <= 20

      if (isSingleWord && isShortWord) {
        return (
          <Badge variant="default" className="font-normal">
            {valueStr}
          </Badge>
        )
      }

      return valueStr
    }

    case CustomFieldType.TEXTAREA:
    default: {
      const textValue = String(props.fieldValue.value ?? '')
      return <span className="whitespace-pre-wrap">{textValue}</span>
    }
  }
}
