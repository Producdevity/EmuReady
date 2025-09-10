'use client'

import { type ReactNode } from 'react'
import { MultiSelect } from '@/components/ui'

export type Option = { id: string; name: string; badgeName?: string }

interface Props {
  label: string
  leftIcon?: ReactNode
  value: string[]
  onChange: (values: string[]) => void
  options: Option[]
  placeholder?: string
  maxDisplayed?: number
  className?: string
}

export default function FilterField(props: Props) {
  return (
    <MultiSelect
      label={props.label}
      leftIcon={props.leftIcon}
      value={props.value}
      onChange={props.onChange}
      options={props.options}
      placeholder={props.placeholder}
      maxDisplayed={props.maxDisplayed}
      className={props.className}
    />
  )
}
