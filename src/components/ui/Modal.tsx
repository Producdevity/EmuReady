'use client'

import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  hideCloseButton?: boolean
  isNested?: boolean
}

function Modal({ onClose, ...props }: Props) {
  const size = props.size ?? 'md'
  const hideCloseButton = props.hideCloseButton ?? false
  const isNested = props.isNested ?? false

  useEffect(() => {
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
  }, [onClose, props.isOpen])

  if (!props.isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if the click is directly on the backdrop, not bubbling from child elements
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in',
        isNested ? 'z-[60]' : 'z-50',
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-h-[90vh] transform transition-all duration-300 ease-out animate-slide-up',
          sizeClasses[size],
          props.className,
        )}
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        {(!!props.title || !hideCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {props.title && (
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {props.title}
              </h2>
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow min-h-0">
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default Modal
