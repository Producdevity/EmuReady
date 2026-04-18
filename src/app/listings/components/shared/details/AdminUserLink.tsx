import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Props {
  userId: string
  name: string | null
}

export function AdminUserLink(props: Props) {
  return (
    <Link
      href={`/admin/users?userId=${props.userId}`}
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
    >
      {props.name ?? 'Unknown User'}
      <ExternalLink className="h-3 w-3" />
    </Link>
  )
}
