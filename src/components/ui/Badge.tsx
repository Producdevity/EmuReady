'use client'

import { type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type BadgeSize = 'sm' | 'md' | 'lg'
export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  info: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1.5',
}

interface Props extends PropsWithChildren {
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  pill?: boolean
  onClick?: () => void
}

export function Badge(props: Props) {
  const variant = props.variant ?? 'default'
  const size = props.size ?? 'md'

  return (
    <span
      onClick={props.onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium text-center',
        props.onClick ? 'cursor-pointer' : 'cursor-default',
        props.pill ? 'rounded-full' : 'rounded',
        variantClasses[variant],
        sizeClasses[size],
        props.className,
      )}
      onKeyDown={
        props.onClick
          ? (ev) => ev.key === 'Enter' && props.onClick?.()
          : undefined
      }
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
    >
      {props.children}
    </span>
  )
}
