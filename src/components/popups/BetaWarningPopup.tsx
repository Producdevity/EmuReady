'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import storageKeys from '@/data/storageKeys'

const discordUrl = process.env.NEXT_PUBLIC_DISCORD_LINK

export function BetaWarningPopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only show in production
    if (process.env.NODE_ENV !== 'production') return

    // Don't show on admin pages
    if (window.location.pathname.startsWith('/admin')) return

    const hasBeenDismissed = localStorage.getItem(
      storageKeys.popups.betaWarningDismissed,
    )

    if (hasBeenDismissed) return

    // Small delay to ensure page has loaded
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  function handleDismiss() {
    localStorage.setItem(storageKeys.popups.betaWarningDismissed, 'true')
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
                <li>You may encounter bugs or unexpected behavior</li>
                <li>Features may change or be temporarily unavailable</li>
              </ul>

              <p className="mt-2">
                If you find any issues, please report them on our{' '}
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord Community"
                  className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Discord
                </a>{' '}
                or{' '}
                <a
                  href="https://github.com/Producdevity/EmuReady"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EmuReady GitHub"
                  className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  GitHub
                </a>
                .
                <span className="mt-2">
                  Feel free to explore, create an account, and get familiar with
                  the platform.
                </span>
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
