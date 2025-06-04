'use client'

import { Controller } from 'react-hook-form'
import { Autocomplete, type AutocompleteOptionBase } from '@/components/ui'
import { Puzzle, Info } from 'lucide-react'
import { type RouterInput } from '@/types/trpc'
import { type Control } from 'react-hook-form'
import { type Nullable } from '@/types/utils'

type ListingFormValues = RouterInput['listings']['create']

interface GameOption extends AutocompleteOptionBase {
  id: string
  title: string
  system: { id: string; name: string }
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
            optionToLabel={(item) => `${item.title} (${item.system.name})`}
            placeholder="Search for a game..."
            minCharsToTrigger={2}
          />
        )}
      />
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
      {props.selectedGame && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 mr-2" />
            <span>
              Selected: <strong>{props.selectedGame.title}</strong> for{' '}
              <strong>{props.selectedGame.system.name}</strong>
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export default GameSelector
