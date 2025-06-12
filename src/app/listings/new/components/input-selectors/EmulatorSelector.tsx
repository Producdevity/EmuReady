'use client'

import { Gamepad2, AlertCircle } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { type Control, type UseFormSetValue } from 'react-hook-form'
import GitHubIcon from '@/components/icons/GitHubIcon'
import { Autocomplete, type AutocompleteOptionBase } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterInput } from '@/types/trpc'

type ListingFormValues = RouterInput['listings']['create']

interface GameOption extends AutocompleteOptionBase {
  id: string
  title: string
  system: { id: string; name: string }
}

interface EmulatorOption extends AutocompleteOptionBase {
  id: string
  name: string
  systems: { id: string; name: string }[]
}

interface Props {
  control: Control<ListingFormValues>
  selectedGame: GameOption | null
  availableEmulators: EmulatorOption[]
  emulatorSearchTerm: string
  emulatorInputFocus: boolean
  errorMessage?: string
  loadEmulatorItems: (query: string) => Promise<EmulatorOption[]>
  setValue: UseFormSetValue<ListingFormValues>
  onFocus: () => void
  onBlur: () => void
}

function EmulatorSelector(props: Props) {
  if (!props.selectedGame) {
    return (
      <>
        <label
          htmlFor="emulatorId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Emulator
        </label>
        <div className="mt-1 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center text-sm text-yellow-700 dark:text-yellow-300">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Please select a game first to see compatible emulators</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Controller
        name="emulatorId"
        control={props.control}
        render={({ field }) => (
          <Autocomplete<EmulatorOption>
            label="Emulator"
            leftIcon={<Gamepad2 className="w-5 h-5" />}
            value={field.value}
            onChange={(value) => {
              field.onChange(value)
              // reset, setting customFieldValues is handled in useEffect
              props.setValue('customFieldValues', [])
            }}
            onFocus={props.onFocus}
            onBlur={props.onBlur}
            loadItems={props.loadEmulatorItems}
            optionToValue={(item) => item.id}
            optionToLabel={(item) => item.name}
            placeholder={`Search for emulators that support ${props.selectedGame?.system.name}...`}
            minCharsToTrigger={1}
          />
        )}
      />
      {props.availableEmulators.length === 0 &&
        props.selectedGame &&
        props.emulatorSearchTerm.length >= 1 && (
          <div
            className={cn(
              'p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800',
              props.emulatorInputFocus ? 'mt-14' : 'mt-2',
            )}
          >
            <div className="flex items-center text-sm text-orange-700 dark:text-orange-300">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>
                No emulators found that support{' '}
                <strong>{props.selectedGame.system.name}</strong>. Try a
                different search term, or request to add your emulator by
                opening a GitHub issue.
                <a
                  href="https://github.com/Producdevity/EmuReady/issues/new?template=emulator_request.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Request Emulator on GitHub"
                  className="ml-1 underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <GitHubIcon className="inline w-4 h-4 mr-1" />
                  Request Emulator
                </a>
              </span>
            </div>
          </div>
        )}
      {props.errorMessage && (
        <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>
      )}
    </>
  )
}

export default EmulatorSelector
