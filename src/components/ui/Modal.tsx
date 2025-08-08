'use client'

import { X } from 'lucide-react'
import { useEffect, type ReactNode, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-xl',
  '2xl': 'w-full max-w-2xl',
  '3xl': 'w-full max-w-3xl',
}

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: keyof typeof sizeClasses
  className?: string
  hideCloseButton?: boolean
  isNested?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
}

export function Modal({ onClose, ...props }: Props) {
  const size = props.size ?? 'md'
  const hideCloseButton = props.hideCloseButton ?? false
  const isNested = props.isNested ?? false
  const closeOnBackdropClick = props.closeOnBackdropClick ?? true
  const closeOnEscape = props.closeOnEscape ?? true

  useEffect(() => {
    if (!closeOnEscape) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    if (props.isOpen) {
      document.addEventListener('keydown', handleEscape)
    } else {
      document.removeEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeOnEscape, onClose, props.isOpen])

  if (!props.isOpen) return null

  const handleBackdropClick = (ev: MouseEvent) => {
    if (!closeOnBackdropClick) return
    // Only close if the click is directly on the backdrop, not bubbling from child elements
    if (ev.target !== ev.currentTarget) return
    onClose()
  }

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center px-4 py-6 sm:px-6 bg-black/70 backdrop-blur-sm animate-fade-in',
        isNested ? 'z-[60]' : 'z-50',
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] transform transition-all duration-300 ease-out animate-slide-up',
          sizeClasses[size],
          props.className,
        )}
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        {(!!props.title || !hideCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {props.title && (
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{props.title}</h2>
            )}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow min-h-0 overflow-x-visible">
          {props.children}
        </div>
      </div>
    </div>
  )
}
