'use client'

import { useUser, useClerk, SignInButton } from '@clerk/nextjs'
import { LoadingSpinner } from '@/components/ui'

export default function AccountPage() {
  const { isLoaded, isSignedIn } = useUser()
  const { openUserProfile } = useClerk()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show account management options for both signed in and signed out users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Account Management
          </h1>
          {isSignedIn ? (
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Manage your account settings, privacy, and data
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Sign in to manage your account settings, privacy, and data.
            </p>
          )}
        </div>

        <div className="space-y-4">
          {isSignedIn ? (
            <>
              <button
                onClick={() => openUserProfile()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Open Account Settings
              </button>

              <a
                href="/account/data"
                className="block w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
              >
                Download My Data
              </a>

              <button
                onClick={() => {
                  openUserProfile()
                  // Navigate to security tab for deletion
                }}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Sign In to Manage Account
              </button>
            </SignInButton>
          )}
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">Account management includes:</p>
          <ul className="text-left space-y-1">
            <li>• Update profile information</li>
            <li>• Change email or password</li>
            <li>• Manage connected accounts</li>
            <li>• Download your data (GDPR)</li>
            <li>• Delete your account</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
