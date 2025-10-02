'use client'

import { Search } from 'lucide-react'
import { useCallback, useEffect, useRef, type ChangeEvent } from 'react'
import { Input } from '@/components/ui'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function ListingsSearchBar(props: Props) {
  const { value, onChange, placeholder, className } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const wasTypingRef = useRef(false)

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      wasTypingRef.current = true
      onChange(ev.target.value)
    },
    [onChange],
  )

  useEffect(() => {
    if (!wasTypingRef.current) return

    const inputElement = inputRef.current
    if (!inputElement) return

    // Restore focus
    // Use multiple animation frames to ensure DOM has updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (document.activeElement !== inputElement) {
          inputElement.focus({ preventScroll: true })
          const cursorPosition = inputElement.value.length
          try {
            inputElement.setSelectionRange(cursorPosition, cursorPosition)
          } catch {
            // Ignore selection errors
          }
        }
      })
    })

    const timeout = setTimeout(() => {
      wasTypingRef.current = false
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [value])

  return (
    <Input
      ref={inputRef}
      leftIcon={<Search className="w-5 h-5" />}
      type="text"
      placeholder={placeholder ?? 'Search games, notes, emulators...'}
      value={value}
      onChange={handleChange}
      className={className ?? 'transition-all duration-200 focus:scale-[1.02]'}
    />
  )
}
