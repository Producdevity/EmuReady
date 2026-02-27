import { Users } from 'lucide-react'
import Image from 'next/image'
import { Badge, LocalizedDate } from '@/components/ui'
import { getRoleVariant } from '@/utils/badge-colors'
import { type Role } from '@orm'

interface Props {
  user: {
    id: string
    name: string | null
    profileImage: string | null
    role: Role
    trustScore: number
  }
  date: Date
}

function SocialUserRow(props: Props) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      {props.user.profileImage ? (
        <Image
          src={props.user.profileImage}
          alt={props.user.name ?? 'User'}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {props.user.name ?? 'Unknown'}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Badge variant={getRoleVariant(props.user.role)} size="sm">
            {props.user.role}
          </Badge>
          <span>Trust: {props.user.trustScore}</span>
        </div>
      </div>
      <LocalizedDate
        date={props.date}
        format="timeAgo"
        className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
      />
    </div>
  )
}

export default SocialUserRow
