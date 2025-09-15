'use client'

import { FunnelIcon } from 'lucide-react'

interface Props {
  ariaLabel: string
  activeCount: number
  onClick: () => void
}

export function MobileFiltersFab(props: Props) {
  return (
    <div className="lg:hidden fixed bottom-14 right-6 z-40">
      <button
        type="button"
        onClick={props.onClick}
        className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:scale-110 transition-all duration-300 ease-out"
        aria-label={props.ariaLabel}
      >
        {props.activeCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
            {props.activeCount}
          </div>
        )}
        <FunnelIcon className="w-6 h-6" />
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:animate-ping" />
      </button>
    </div>
  )
}
