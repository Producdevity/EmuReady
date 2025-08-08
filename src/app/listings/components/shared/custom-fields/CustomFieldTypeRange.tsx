import { type ReactNode } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { cn } from '@/lib/utils'

interface CustomFieldDefinitionWithOptions {
  id: string
  name: string
  label: string
  isRequired: boolean
  rangeMin?: number | null
  rangeMax?: number | null
  rangeUnit?: string | null
  rangeDecimals?: number | null
}

interface ValidationRules {
  required: string | boolean
  validate?: (value: unknown) => boolean | string
}

interface Props<TFieldValues extends FieldValues = FieldValues> {
  fieldDef: CustomFieldDefinitionWithOptions
  fieldName: FieldPath<TFieldValues>
  index: number
  rules: ValidationRules
  control: Control<TFieldValues>
  errorMessage: string | undefined
  icon: ReactNode
}

function CustomFieldTypeRange<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  const min = props.fieldDef.rangeMin ?? 0
  const max = props.fieldDef.rangeMax ?? 100
  const unit = props.fieldDef.rangeUnit ?? ''
  const decimals = props.fieldDef.rangeDecimals ?? 0
  const step = decimals > 0 ? Math.pow(10, -decimals) : 1

  const formatValue = (value: number): string => {
    const formatted =
      decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString()
    return unit ? `${formatted}${unit}` : formatted
  }

  const parseValue = (value: string): number => {
    const numericValue = parseFloat(value.replace(unit, ''))
    return isNaN(numericValue)
      ? min
      : Math.max(min, Math.min(max, numericValue))
  }

  return (
    <div key={props.fieldDef.id} className="mb-4">
      <label
        htmlFor={props.fieldName}
        className="pl-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {props.fieldDef.label} {props.fieldDef.isRequired && '*'}
      </label>
      <Controller
        name={props.fieldName}
        control={props.control}
        defaultValue={min as TFieldValues[FieldPath<TFieldValues>]}
        rules={props.rules}
        render={({ field }) => {
          const currentValue =
            typeof field.value === 'number'
              ? field.value
              : parseValue(String(field.value))

          // Format the current value for display
          const displayValue = formatValue(currentValue)

          return (
            <div className="mt-3 space-y-6">
              <div className="relative px-4 py-6 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                {/* Slider Track Container */}
                <div className="relative mb-6">
                  <input
                    type="range"
                    id={props.fieldName}
                    min={min}
                    max={max}
                    step={step}
                    value={currentValue}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value)
                      field.onChange(newValue)
                    }}
                    className="range-slider w-full h-3 bg-transparent cursor-pointer appearance-none focus:outline-none relative z-10"
                  />

                  {/* Track Background with Subtle Gradient */}
                  <div className="absolute top-1/2 left-0 w-full h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full pointer-events-none transform -translate-y-1/2 shadow-inner" />

                  {/* Animated Filled Track with Glow Effect */}
                  <div
                    className="absolute top-1/2 left-0 h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full pointer-events-none transform -translate-y-1/2 transition-all duration-300 ease-out shadow-lg"
                    style={{
                      width: `${((currentValue - min) / (max - min)) * 100}%`,
                      boxShadow:
                        '0 0 20px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                  />

                  <div
                    className="absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full pointer-events-none transform -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out shadow-xl"
                    style={{
                      left: `${((currentValue - min) / (max - min)) * 100}%`,
                      boxShadow:
                        '0 0 25px rgba(59, 130, 246, 0.4), 0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    {/* Inner glow effect */}
                    <div className="absolute inset-1 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-60" />
                  </div>

                  {/* Progress Markers */}
                  <div className="absolute top-full left-0 w-full flex justify-between mt-2 px-1">
                    {[0, 0.25, 0.5, 0.75, 1].map((position) => (
                      <div
                        key={position}
                        className={cn(
                          'w-1 h-2 rounded-full transition-all duration-200',
                          (currentValue - min) / (max - min) >= position
                            ? 'bg-blue-500 shadow-sm'
                            : 'bg-gray-300 dark:bg-gray-600',
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Enhanced Value Display */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                      MIN
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                      {formatValue(min)}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg border border-blue-400/20">
                      <div className="p-1 bg-white/20 rounded-full">
                        {props.icon}
                      </div>
                      <span className="font-bold text-lg tracking-wide">
                        {displayValue}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      CURRENT VALUE
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                      MAX
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                      {formatValue(max)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Manual Input Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-700 dark:to-blue-900/10 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Precise Input
                  </h4>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={currentValue}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value)
                        if (!isNaN(newValue)) {
                          const clampedValue = Math.max(
                            min,
                            Math.min(max, newValue),
                          )
                          field.onChange(clampedValue)
                        }
                      }}
                      className={cn(
                        'flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                        'dark:bg-gray-700 dark:text-white transition-all duration-200',
                        'hover:border-gray-300 dark:hover:border-gray-500',
                        props.errorMessage &&
                          'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20',
                      )}
                      placeholder={`Enter value (${min} - ${max})`}
                    />
                    {unit && (
                      <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-3 rounded-lg shadow-sm">
                        <span className="text-sm font-semibold">{unit}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Enter a value between {formatValue(min)} and{' '}
                    {formatValue(max)}
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full" />
          {props.errorMessage}
        </p>
      )}
    </div>
  )
}

export default CustomFieldTypeRange
