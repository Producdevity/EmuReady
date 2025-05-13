'use client'

import React from 'react'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  pill?: boolean
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  pill = false,
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    success:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5',
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center font-medium
        ${pill ? 'rounded-full' : 'rounded'}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
