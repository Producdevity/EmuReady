'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type TailwindColor } from '@orm'

const TAILWIND_COLORS: TailwindColor[] = [
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const

// Color to CSS class mapping for visual representation
const COLOR_CLASSES: Record<TailwindColor, string> = {
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
  gray: 'bg-gray-500',
  zinc: 'bg-zinc-500',
  neutral: 'bg-neutral-500',
  stone: 'bg-stone-500',
}

interface ColorPickerProps {
  selectedColor: TailwindColor
  onColorChange: (color: TailwindColor) => void
  label?: string
  className?: string
}

export function ColorPicker(props: ColorPickerProps) {
  return (
    <div className={props.className}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {props.label}
        </label>
      )}
      <div className="grid grid-cols-6 gap-2">
        {TAILWIND_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => props.onColorChange(color)}
            className={cn(
              'w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
              COLOR_CLASSES[color],
              props.selectedColor === color && 'ring-2 ring-blue-500 ring-offset-2 scale-110',
            )}
            title={color.charAt(0).toUpperCase() + color.slice(1)}
          >
            {props.selectedColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Selected: {props.selectedColor.charAt(0).toUpperCase() + props.selectedColor.slice(1)}
      </p>
    </div>
  )
}
