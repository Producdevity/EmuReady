'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { LoadingSpinner } from '@/components/ui'

export default function AccountDeletePage() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Account Deletion
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Sign in to manage your account settings and request account
              deletion.
            </p>
          </div>

          <div className="space-y-4">
            <SignInButton mode="modal">
              <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Sign In to Manage Account
              </button>
            </SignInButton>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="mb-2">After signing in:</p>
              <ol className="text-left list-decimal list-inside space-y-1">
                <li>Your account settings will open automatically</li>
                <li>Navigate to the &quot;Security&quot; tab</li>
                <li>Click &quot;Delete account&quot; at the bottom</li>
                <li>Follow the confirmation steps</li>
              </ol>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-3">
              What happens when you delete your account?
            </h2>
            <ul className="text-sm text-gray-600 dark:text-gray-400 text-left space-y-2">
              <li>• All your personal data will be permanently deleted</li>
              <li>• Your listings and comments will be removed</li>
              <li>• You will lose access to all EmuReady services</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-500">
            <p>Need help? Contact support at support@emuready.com</p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Opening account settings...
      </p>
    </div>
  )
}
