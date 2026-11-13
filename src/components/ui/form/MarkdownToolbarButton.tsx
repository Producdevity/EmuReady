import { type ComponentType } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  onClick: () => void
  icon: ComponentType<{ className?: string }>
  title: string
  disabled?: boolean
}

export function MarkdownToolbarButton(props: Props) {
  const Icon = props.icon

  return (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      aria-label={props.title}
      className={cn(
        'p-2 rounded-md transition-colors duration-150',
        'text-gray-600 dark:text-gray-400',
        'hover:text-gray-800 dark:hover:text-gray-200',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
      disabled={props.disabled}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
