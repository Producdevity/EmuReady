'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/utils/copyToClipboard'

interface Props {
  label: string | number
  value?: string | number
  hideTooltip?: boolean
  maxLength?: number
  className?: string
}

export function Code(props: Props) {
  const stringifiedLabel = typeof props.label === 'number' ? props.label.toString() : props.label

  const label = props.maxLength
    ? stringifiedLabel.length > props.maxLength
      ? `${stringifiedLabel.slice(0, props.maxLength)}…`
      : stringifiedLabel
    : stringifiedLabel

  const Content = (
    <code
      onClick={() => copyToClipboard(props.value ?? props.label)}
      className={cn(
        'text-xs text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded cursor-pointer',
        props.className,
      )}
    >
      {label}
    </code>
  )

  return props.hideTooltip ? (
    Content
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>{Content}</TooltipTrigger>
      <TooltipContent>
        Click to copy <strong>{props.value ?? props.label}</strong> to clipboard
      </TooltipContent>
    </Tooltip>
  )
}
