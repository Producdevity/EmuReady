import Link from 'next/link'

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

        <Link
          href="/login"
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white inline-block px-4 py-2 rounded-md text-sm font-medium"
        >
          Sign In
        </Link>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Don&#39;t have an account?{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ProfilePageUnauthenticated
