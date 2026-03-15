'use client'

import { Gamepad2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, LocalizedDate } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'

type VisibleResult = Extract<
  RouterOutput['gameFollows']['getFollowedGames'],
  { visibility: 'visible' }
>

type GameFollowItem = VisibleResult['items'][number]

interface Props {
  item: GameFollowItem
  size?: 'sm' | 'md'
  showDate?: boolean
  onClick?: () => void
}

function GameFollowRow(props: Props) {
  const game = props.item.game
  const isMd = props.size === 'md'
  const imgSize = isMd ? 40 : 32
  const imgClass = isMd ? 'w-10 h-10' : 'w-8 h-8'
  const iconClass = isMd ? 'w-5 h-5' : 'w-4 h-4'
  const titleClass = isMd ? 'text-sm' : 'text-xs'

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={props.onClick}
    >
      {game.imageUrl ? (
        <Image
          src={game.imageUrl}
          alt={game.title}
          width={imgSize}
          height={imgSize}
          className={cn('rounded object-cover', imgClass)}
          unoptimized
        />
      ) : (
        <div
          className={cn(
            imgClass,
            'rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center',
          )}
        >
          <Gamepad2 className={cn(iconClass, 'text-gray-400')} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(titleClass, 'font-medium text-gray-900 dark:text-white truncate')}>
          {game.title}
        </p>
        <div className="flex items-center gap-2">
          {game.system && (
            <Badge variant="default" size="sm">
              {game.system.name}
            </Badge>
          )}
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {game._count.listings + game._count.pcListings} reports
          </span>
        </div>
      </div>
      {(props.showDate ?? true) && (
        <LocalizedDate
          date={props.item.createdAt}
          format="timeAgo"
          className="text-[10px] text-gray-400 shrink-0"
        />
      )}
    </Link>
  )
}

export default GameFollowRow
