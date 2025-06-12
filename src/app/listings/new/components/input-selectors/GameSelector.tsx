'use client'

import { Puzzle, Info } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { type Control } from 'react-hook-form'
import { Autocomplete, type AutocompleteOptionBase } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterInput } from '@/types/trpc'
import { type Nullable } from '@/types/utils'
import { ApprovalStatus } from '@orm'

type ListingFormValues = RouterInput['listings']['create']

interface GameOption extends AutocompleteOptionBase {
  id: string
  title: string
  system: { id: string; name: string }
  status?: string
}

interface Props {
  control: Control<ListingFormValues>
  selectedGame: Nullable<GameOption>
  errorMessage?: string
  loadGameItems: (query: string) => Promise<GameOption[]>
  onGameSelect: (game: Nullable<GameOption>) => void
  gameSearchTerm: string
}

function GameSelector(props: Props) {
  return (
    <>
      <Controller
        name="gameId"
        control={props.control}
        render={({ field }) => (
          <Autocomplete<GameOption>
            label="Game"
            leftIcon={<Puzzle className="w-5 h-5" />}
            value={field.value}
            onChange={(value) => {
              field.onChange(value)
              // Find and set the selected game
              if (!value) return props.onGameSelect(null)

              props.loadGameItems(props.gameSearchTerm).then((games) => {
                const game = games.find((g) => g.id === value)
                if (game) props.onGameSelect(game)
              })
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
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
      {props.selectedGame && (
        <div
          className={cn(
            'mt-2 p-3 rounded-lg border',
            props.selectedGame.status === ApprovalStatus.PENDING
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          )}
        >
          <div
            className={cn(
              'flex items-center text-sm',
              props.selectedGame.status === ApprovalStatus.PENDING
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-blue-700 dark:text-blue-300',
            )}
          >
            <Info className="w-4 h-4 mr-2" />
            <span>
              Selected: <strong>{props.selectedGame.title}</strong> for{' '}
              <strong>{props.selectedGame.system.name}</strong>
              {props.selectedGame.status === ApprovalStatus.PENDING && (
                <span className="ml-2 text-xs font-medium">
                  (Pending Approval)
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export default GameSelector
