import { type KeyboardEvent } from 'react'

export function useFormKeyDown() {
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && event.target instanceof HTMLElement) {
      if (event.target.tagName.toLowerCase() === 'textarea') return
      event.preventDefault()
    }
  }

  return { handleKeyDown }
}
