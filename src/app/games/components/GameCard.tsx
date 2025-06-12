import Image from 'next/image'
import Link from 'next/link'
import { Badge, ApprovalStatusBadge } from '@/components/ui'
import getGameImageUrl from '@/utils/images/getGameImageUrl'
import { type Game, ApprovalStatus } from '@orm'

interface Props {
  game: Game & {
    system?: { name: string } | null
    _count: { listings: number }
  }
}

function GameCard(props: Props) {
  return (
    <Link
      key={props.game.id}
      href={`/games/${props.game.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
        <Image
          src={getGameImageUrl(props.game)}
          alt={props.game.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white truncate">
          {props.game.title}
        </h2>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="default">
            {props.game.system?.name ?? 'Unknown System'}
          </Badge>
          {props.game.status &&
            props.game.status !== ApprovalStatus.APPROVED && (
              <ApprovalStatusBadge status={props.game.status} />
            )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {props.game._count.listings}{' '}
          {props.game._count.listings === 1 ? 'listing' : 'listings'}
        </div>
      </div>
    </Link>
  )
}

export default GameCard
