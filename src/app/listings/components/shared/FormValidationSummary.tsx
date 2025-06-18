'use client'

import { AlertCircle } from 'lucide-react'
import { type FieldErrors, type FieldValues } from 'react-hook-form'

interface Props<TFieldValues extends FieldValues = FieldValues> {
  errors: FieldErrors<TFieldValues>
}

function FormValidationSummary<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  const hasErrors = Object.keys(props.errors).length > 0

  if (!hasErrors) return null

  // Collect all error messages
  const errorMessages: string[] = []

  // Add basic field errors
  Object.entries(props.errors).forEach(([key, error]) => {
    if (key === 'customFieldValues') {
      // Handle custom field errors
      if (Array.isArray(error)) {
        error.forEach((fieldError) => {
          if (fieldError?.value?.message) {
            errorMessages.push(fieldError.value.message)
          }
        })
      } else if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        error.message
      ) {
        errorMessages.push(error.message as string)
      }
    } else if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      error.message
    ) {
      errorMessages.push(error.message as string)
    }
  })

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

export default FormValidationSummary
