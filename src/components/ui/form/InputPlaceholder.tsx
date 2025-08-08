import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/utils/copyToClipboard'

interface Props {
  label: string
  value: string
  mono?: boolean
  className?: string
}

export function InputPlaceholder(props: Props) {
  return (
    <div className={cn('mb-2', props.className)}>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{props.label}</p>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex items-center justify-between text-sm p-3 rounded-md',
          'text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700',
          props.mono ? 'font-mono' : 'font-sans',
        )}
        onClick={() => copyToClipboard(props.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') copyToClipboard(props.value)
        }}
      >
        <span className="truncate">{props.value}</span>
        <Copy className="h-4 w-4 shrink-0 ml-2" />
      </div>
    </div>
  )
}
