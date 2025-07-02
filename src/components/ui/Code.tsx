'use client'

import { isNumber, isString } from 'remeda'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/utils/copyToClipboard'

interface Props {
  label: string | number
  value?: string | number
  className?: string
}

export function Code(props: Props) {
  const handleClick = () => {
    const value = isNumber(props.value) ? String(props.value) : props.value

    if (!isString(value) || value?.trim() === '') return

    copyToClipboard(value)
  }

  const Content = (
    <code
      onClick={handleClick}
      className={cn(
        'text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded',
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
