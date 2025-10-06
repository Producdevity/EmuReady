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
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {props.fieldValue.value}
          </a>
        )
      }
      return String(props.fieldValue.value)
    }

    case CustomFieldType.TEXT: {
      if (props.fieldValue.customFieldDefinition.name === DRIVER_VERSION_FIELD_NAME) {
        const valueStr = String(props.fieldValue.value ?? '')
        if (valueStr.includes('|||')) {
          const [displayPart] = valueStr.split('|||')
          return <span className="break-words overflow-wrap-anywhere">{displayPart}</span>
        }
        try {
          const parsed = JSON.parse(valueStr)
          if (parsed && typeof parsed === 'object') {
            return (
              <span className="break-words overflow-wrap-anywhere">
                {parsed.display || parsed.release || 'Custom Driver'}
              </span>
            )
          }
        } catch {
          // Not JSON, fall through
        }
        return <span className="break-words overflow-wrap-anywhere">{valueStr}</span>
      }
      return (
        <span className="break-words overflow-wrap-anywhere">
          {String(props.fieldValue.value ?? '')}
        </span>
      )
    }

    case CustomFieldType.TEXTAREA:
    default:
      return (
        <span className="break-words overflow-wrap-anywhere">
          {String(props.fieldValue.value ?? '')}
        </span>
      )
  }
}
