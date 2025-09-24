import { cn } from '@/lib/utils'

interface Props<T> {
  onClick: (value: T) => void
  value?: T
  label: string
  isSelected: boolean
}

export function ModalCommonButton<T>(props: Props<T>) {
  return (
    <button
      type="button"
      aria-label={`Select ${props.label}`}
      aria-pressed={props.isSelected}
      onClick={() => props.onClick((props.value ?? props.label) as T)}
      className={cn(
        'px-2 py-1 text-xs rounded-md transition-colors',
        props.isSelected
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600',
      )}
    >
      {props.label}
    </button>
  )
}
