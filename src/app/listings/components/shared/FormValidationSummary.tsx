'use client'

import { AlertCircle } from 'lucide-react'
import { type FieldErrors, type FieldValues } from 'react-hook-form'

interface CustomFieldDefinition {
  id: string
  label: string
  name: string
}

interface Props<TFieldValues extends FieldValues = FieldValues> {
  errors: FieldErrors<TFieldValues>
  customFieldDefinitions?: CustomFieldDefinition[]
  fieldLabels?: Record<string, string>
}

export function FormValidationSummary<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  const hasErrors = Object.keys(props.errors).length > 0

  if (!hasErrors) return null

  // Collect all error messages
  type ErrorEntry = { path: string[]; message: string }

  function formatFieldKey(key: string): string {
    if (!key) return 'Field'
    const spaced = key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim()
    return spaced.charAt(0).toUpperCase() + spaced.slice(1)
  }

  function collectErrorEntries(node: unknown, path: string[] = []): ErrorEntry[] {
    if (!node) return []

    if (Array.isArray(node)) {
      return node.flatMap((child, index) => collectErrorEntries(child, [...path, String(index)]))
    }

    if (typeof node !== 'object') return []

    const entries: ErrorEntry[] = []
    const errorNode = node as Record<string, unknown>

    const message = errorNode.message
    if (typeof message === 'string' && message.length > 0) {
      entries.push({ path, message })
    }

    Object.entries(errorNode).forEach(([key, value]) => {
      if (key === 'message' || key === 'type' || key === 'ref' || key === 'types') return
      entries.push(...collectErrorEntries(value, [...path, key]))
    })

    return entries
  }

  const errorEntries = Object.entries(props.errors).flatMap(([key, value]) =>
    collectErrorEntries(value, [key]),
  )

  const filteredEntries = errorEntries.filter(
    (entry, index, array) =>
      !array.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.path.length > entry.path.length &&
          entry.path.every((segment, segmentIndex) => segment === other.path[segmentIndex]),
      ),
  )

  function resolveStandardFieldMessage(fieldKey: string, message: string): string {
    const label = props.fieldLabels?.[fieldKey] ?? formatFieldKey(fieldKey)
    if (message === 'Required') return `${label} is required`
    return `${label}: ${message}`
  }

  function resolveCustomFieldFromPath(path: string[], message: string): string | null {
    if (path[0] !== 'customFieldValues') return null

    if (path.length === 1 || path[1] === 'root' || !Number.isFinite(Number(path[1]))) {
      if (message === 'Required') return 'Custom fields are required'
      return `Custom fields: ${message}`
    }

    const index = Number(path[1])
    const label = props.customFieldDefinitions?.[index]?.label ?? `Custom field ${index + 1}`
    if (message === 'Required') return `${label} is required`
    return `${label}: ${message}`
  }

  const errorMessages = filteredEntries.map((entry) => {
    const customFieldMessage = resolveCustomFieldFromPath(entry.path, entry.message)
    if (customFieldMessage) return customFieldMessage

    return resolveStandardFieldMessage(entry.path[0], entry.message)
  })

  if (errorMessages.length === 0) {
    errorMessages.push('Please check all required fields are filled in correctly')
  }

  return (
    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {errorMessages.map((message, index) => (
              <li key={index}>• {message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
