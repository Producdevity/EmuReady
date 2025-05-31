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

  return (
    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          {/*TODO: fix this, it only shows "Please fix the following errors:" */}
          {/*TODO: fix this, it only shows "Please fix the following errors:" */}
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {props.errors.gameId && <li>• {props.errors.gameId.message}</li>}
            {props.errors.deviceId && (
              <li>• {props.errors.deviceId.message}</li>
            )}
            {props.errors.emulatorId && (
              <li>• {props.errors.emulatorId.message}</li>
            )}
            {props.errors.performanceId && (
              <li>• {props.errors.performanceId.message}</li>
            )}
            {props.errors.notes && <li>• {props.errors.notes.message}</li>}
            {props.errors.customFieldValues && (
              <>
                {Array.isArray(props.errors.customFieldValues) ? (
                  props.errors.customFieldValues.map((error, index) =>
                    error?.value?.message ? (
                      <li key={index}>• {error.value.message}</li>
                    ) : null,
                  )
                ) : (
                  <li>• {props.errors.customFieldValues.message}</li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default FormValidationSummary
