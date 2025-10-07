'use client'

import { Puzzle } from 'lucide-react'
import Image from 'next/image'
import { Controller } from 'react-hook-form'
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Autocomplete } from '@/components/ui'
import { logger } from '@/lib/logger'
import { type Nullable } from '@/types/utils'
import { ApprovalStatus } from '@orm'
import { SelectedItemCard } from '../SelectedItemCard'
import { type GameOption } from '../types'

interface Props<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  selectedGame: Nullable<GameOption>
  errorMessage?: string
  loadGameItems: (query: string) => Promise<GameOption[]>
  onGameSelect: (game: Nullable<GameOption>) => void
  gameSearchTerm: string
}

export function GameSelector<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  const thumbnailUrl = props.selectedGame?.boxartUrl ?? props.selectedGame?.imageUrl

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Game
      </label>

      {props.selectedGame ? (
        <SelectedItemCard
          leftContent={
            thumbnailUrl ? (
              <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={thumbnailUrl}
                  alt={props.selectedGame.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-12 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Puzzle className="w-6 h-6 text-gray-400" />
              </div>
            )
          }
          title={props.selectedGame.title}
          subtitle={props.selectedGame.system.name}
          badge={
            props.selectedGame.status === ApprovalStatus.PENDING ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                Pending
              </span>
            ) : undefined
          }
          onClear={() => {
            props.onGameSelect(null)
          }}
        />
      ) : (
        <Controller
          name={props.name}
          control={props.control}
          render={({ field }) => (
            <Autocomplete<GameOption>
              leftIcon={<Puzzle className="w-5 h-5" />}
              value={field.value}
              onChange={(value) => {
                field.onChange(value)
                if (!value) return props.onGameSelect(null)

                props
                  .loadGameItems(props.gameSearchTerm)
                  .then((games) => {
                    const game = games.find((g) => g.id === value)
                    if (game) props.onGameSelect(game)
                  })
                  .catch((error) =>
                    logger.error(`[GameSelector] loadGameItems for ${props.gameSearchTerm}`, error),
                  )
              }}
              loadItems={props.loadGameItems}
              optionToValue={(item) => item.id}
              optionToLabel={(item) =>
                item.status === ApprovalStatus.PENDING
                  ? `${item.title} (${item.system.name}) - Pending Approval`
                  : `${item.title} (${item.system.name})`
              }
              placeholder="Search for a game..."
              minCharsToTrigger={2}
            />
          )}
        />
      )}

      {props.errorMessage && <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>}
    </div>
  )
}
