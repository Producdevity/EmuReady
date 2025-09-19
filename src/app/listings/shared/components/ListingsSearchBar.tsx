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
  const inputRef = useRef<HTMLInputElement>(null)
  const typingRef = useRef(false)

  const handleChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      typingRef.current = true
      props.onChange(ev.target.value)
    },
    [props],
  )

  useEffect(() => {
    if (!typingRef.current) return

    const inputElement = inputRef.current
    if (!inputElement) return

    const isIOS = typeof navigator !== 'undefined' && /iP(ad|hone|od)/.test(navigator.userAgent)

    if (!isIOS) {
      typingRef.current = false
      return
    }

    requestAnimationFrame(() => {
      inputElement.focus({ preventScroll: true })
      const cursorPosition = inputElement.value.length
      try {
        inputElement.setSelectionRange(cursorPosition, cursorPosition)
      } catch {
        // Ignore selection errors on unsupported inputs
      }
    })

    const timeout = setTimeout(() => {
      typingRef.current = false
    }, 400)

    return () => {
      clearTimeout(timeout)
    }
  }, [props.value])

  return (
    <Input
      ref={inputRef}
      leftIcon={<Search className="w-5 h-5" />}
      type="text"
      placeholder={props.placeholder ?? 'Search games, notes, emulators...'}
      value={props.value}
      onChange={handleChange}
      className={props.className ?? 'transition-all duration-200 focus:scale-[1.02]'}
    />
  )
}
