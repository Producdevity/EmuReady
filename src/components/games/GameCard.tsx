import { Badge } from '@/components'
import type { Game } from '@orm'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

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
          src={
            props.game.imageUrl ??
            `https://placehold.co/400x300/9ca3af/1e293b?text=${encodeURIComponent(props.game.title.substring(0, 15))}`
          }
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
        <div className="flex items-center justify-between">
          <Badge variant="default">
            {props.game.system?.name ?? 'Unknown System'}
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {props.game._count.listings}{' '}
            {props.game._count.listings === 1 ? 'listing' : 'listings'}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default GameCard
