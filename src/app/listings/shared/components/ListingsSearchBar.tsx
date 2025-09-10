'use client'

import { Search } from 'lucide-react'
import { type ChangeEvent } from 'react'
import { Input } from '@/components/ui'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function ListingsSearchBar({ value, onChange, placeholder, className }: Props) {
  return (
    <Input
      leftIcon={<Search className="w-5 h-5" />}
      type="text"
      placeholder={placeholder ?? 'Search games, notes, emulators...'}
      value={value}
      onChange={(ev: ChangeEvent<HTMLInputElement>) => onChange(ev.target.value)}
      className={className ?? 'transition-all duration-200 focus:scale-[1.02]'}
    />
  )
}
