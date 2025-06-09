'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Modal } from '@/components/ui'
import storageKeys from '@/data/storageKeys'

function BetaWarningModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only show in production
    if (process.env.NODE_ENV !== 'production') return

    // Don't show on admin pages
    if (window.location.pathname.startsWith('/admin')) return

    const hasBeenDismissed = localStorage.getItem(
      storageKeys.betaWarningDismissed,
    )

    if (hasBeenDismissed) return

    // Small delay to ensure page has loaded
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  function handleDismiss() {
    localStorage.setItem(storageKeys.betaWarningDismissed, 'true')
    setIsOpen(false)
  }

  if (process.env.NODE_ENV !== 'production' || !isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      hideCloseButton={true}
      className="max-w-lg"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Welcome to EmuReady Beta!
            </h2>

            <div className="text-gray-600 dark:text-gray-300 space-y-3 mb-6">
              <p>
                Thanks for checking out EmuReady! We&apos;re excited to have you
                here, but please note that
                <strong className="text-gray-800 dark:text-gray-200">
                  {' '}
                  we&apos;re still in beta testing
                </strong>
                .
              </p>

              <p>What this means:</p>

              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Most data you see is placeholder content for testing purposes
                </li>
                <li>Features may change or be temporarily unavailable</li>
                <li>
                  Your account and data are safe, but some content may be reset
                </li>
              </ul>

              <p>
                Feel free to explore, create an account, and get familiar with
                the platform.
                <strong className="text-gray-800 dark:text-gray-200">
                  {' '}
                  Our official launch is coming very soon!
                </strong>
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleDismiss}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                I understand
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default BetaWarningModal
