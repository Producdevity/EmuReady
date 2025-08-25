import Link from 'next/link'
import { Badge } from '@/components/ui'

interface Author {
  id?: string | null
  name?: string | null
  userBans?: { id: string }[] | null
}

interface Props {
  author?: Author | null
  canSeeBannedUsers: boolean
}

export function AuthorDisplay(props: Props) {
  return (
    <div className="flex items-center gap-2">
      {props.author?.id ? (
        <Link
          href={`/users/${props.author.id}`}
          className="text-blue-600 dark:text-indigo-400 hover:underline"
        >
          {props.author?.name ?? 'Anonymous'}
        </Link>
      ) : (
        <span>{props.author?.name ?? 'Anonymous'}</span>
      )}
      {props.canSeeBannedUsers &&
        props.author &&
        'userBans' in props.author &&
        Array.isArray(props.author.userBans) &&
        props.author.userBans.length > 0 && (
          <Badge variant="danger" size="sm">
            BANNED
          </Badge>
        )}
    </div>
  )
}
