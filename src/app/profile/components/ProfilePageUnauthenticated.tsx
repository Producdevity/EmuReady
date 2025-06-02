import { SignInButton, SignUpButton } from '@clerk/nextjs'

function ProfilePageUnauthenticated() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Please sign in to view your profile
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          You need to be logged in to access this page.
        </p>

        <SignInButton mode="modal" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Don&#39;t have an account? <SignUpButton mode="modal" />
        </p>
      </div>
    </div>
  )
}

export default ProfilePageUnauthenticated
