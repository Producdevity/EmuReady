'use client'

import React, { useEffect } from 'react'
import { type ChangeEvent, type ReactNode, type KeyboardEvent } from 'react'

interface SearchGameFieldProps {
  inputValue: string
  placeholder: string
  disabled: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onFocus: () => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
}

const SearchGameField = (props: SearchGameFieldProps) => {
  const {
    inputValue,
    placeholder,
    disabled,
    inputRef,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
  } = props

  useEffect(() => {
    if (inputValue.length > 0) {
      inputRef?.current?.focus()
    }
  }, [disabled, inputRef, inputValue])

  return (
    <input
      ref={inputRef}
      type="text"
      className={
        'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 pr-10 pl-10'
      }
      placeholder={placeholder}
      value={inputValue}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      disabled={disabled}
      autoComplete="off"
    />
  )
}

export default SearchGameField
