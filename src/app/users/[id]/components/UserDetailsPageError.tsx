import Link from 'next/link'

interface Props {
  errorMessage?: string
}

function UserDetailsPageError(props: Props) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
        <p>Error loading profile: {props.errorMessage ?? 'User not found'}</p>
        <Link href="/" className="text-red-800 dark:text-red-200 underline">
          Return home
        </Link>
      </div>
    </div>
  )
}

export default UserDetailsPageError
