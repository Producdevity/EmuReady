'use client'

import { AlertCircle } from 'lucide-react'
import { type FieldErrors } from 'react-hook-form'
import { type RouterInput } from '@/types/trpc'

type ListingFormValues = RouterInput['listings']['create']

interface Props {
  errors: FieldErrors<ListingFormValues>
}

function FormValidationSummary(props: Props) {
  const hasErrors = Object.keys(props.errors).length > 0

  if (!hasErrors) return null

  // Collect all error messages
  const errorMessages: string[] = []

  // Add basic field errors
  if (props.errors.gameId?.message) {
    errorMessages.push(props.errors.gameId.message)
  }
  if (props.errors.deviceId?.message) {
    errorMessages.push(props.errors.deviceId.message)
  }
  if (props.errors.emulatorId?.message) {
    errorMessages.push(props.errors.emulatorId.message)
  }
  if (props.errors.performanceId?.message) {
    errorMessages.push(props.errors.performanceId.message)
  }
  if (props.errors.notes?.message) {
    errorMessages.push(props.errors.notes.message)
  }

  // Add custom field errors
  if (props.errors.customFieldValues) {
    if (Array.isArray(props.errors.customFieldValues)) {
      props.errors.customFieldValues.forEach((error) => {
        if (error?.value?.message) {
          errorMessages.push(error.value.message)
        }
      })
    } else if (props.errors.customFieldValues.message) {
      errorMessages.push(props.errors.customFieldValues.message)
    }
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

export default FormValidationSummary
