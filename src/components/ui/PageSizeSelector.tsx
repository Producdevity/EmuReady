'use client'

import { useCallback } from 'react'
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '@/data/constants'
import { cn } from '@/lib/utils'
import { Dropdown } from './Dropdown'

interface Props {
  value: number
  onChange: (value: PageSizeOption) => void
  options?: readonly number[]
  disabled?: boolean
  className?: string
}

export function PageSizeSelector(props: Props) {
  const options = props.options ?? PAGE_SIZE_OPTIONS

  const dropdownOptions = options.map((opt) => ({
    value: String(opt),
    label: String(opt),
  }))

  const handleChange = useCallback(
    (value: string) => {
      if (props.disabled) return
      const numValue = parseInt(value, 10) as PageSizeOption
      props.onChange(numValue)
    },
    [props],
  )

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        props.disabled && 'opacity-50 pointer-events-none',
        props.className,
      )}
    >
      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Show</span>
      <Dropdown
        options={dropdownOptions}
        value={String(props.value)}
        onChange={handleChange}
        triggerClassName="min-w-[70px] py-1.5"
        position="top"
      />
      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">per page</span>
    </div>
  )
}
