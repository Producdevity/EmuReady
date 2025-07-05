'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/utils/copyToClipboard'

interface Props {
  label: string | number
  value?: string | number
  className?: string
}

export function Code(props: Props) {
  const Content = (
    <code
      onClick={() => copyToClipboard(props.value ?? props.label)}
      className={cn(
        'text-xs text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded',
        props.className,
      )}
    >
      {props.label}
    </code>
  )

  return !props.value ? (
    Content
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>{Content}</TooltipTrigger>
      <TooltipContent>
        Click to copy <strong>{props.value}</strong> to clipboard
      </TooltipContent>
    </Tooltip>
  )
}
