import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { LoadingSpinner } from '@/components/ui'
import useMounted from '@/hooks/useMounted'

interface ListingFormAuthGuardProps {
  isLoading: boolean
  isAuthenticated: boolean
  children: React.ReactNode
}

export function ListingFormAuthGuard(props: ListingFormAuthGuardProps) {
  const mounted = useMounted()

  if (!mounted) return null

  if (props.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!props.isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Who this?</h1>
          <p className="text-gray-600 mb-6">Please sign in to create a new compatibility report.</p>

          <div className="mt-4">
            <SignInButton mode="modal">
              <p className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <span className="block text-gray-900 dark:text-white font-medium">Login</span>
              </p>
            </SignInButton>

            <SignUpButton mode="modal">
              <p className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <span className="block text-gray-900 dark:text-white font-medium">Sign Up</span>
              </p>
            </SignUpButton>
          </div>
        </div>
      </div>
    )
  }

  return <>{props.children}</>
}
