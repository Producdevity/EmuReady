import { ArrowRight, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import analytics from '@/lib/analytics'

export function HomeActionButtons() {
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16 px-2 sm:px-4">
      <Link
        href="/pc-listings"
        onClick={() => {
          analytics.navigation.menuItemClicked({
            menuItem: 'Browse PC Compatibility',
            section: 'home_action_buttons',
            page: '/',
          })
        }}
        className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-blue-500/25 transition duration-300 transform hover:scale-105 hover:shadow-blue-500/40"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Browse PC Compatibility
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </span>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-600 blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
      </Link>

      <Link
        href="/listings"
        onClick={() => {
          analytics.navigation.menuItemClicked({
            menuItem: 'Browse Handheld Compatibility',
            section: 'home_action_buttons',
            page: '/',
          })
        }}
        className="group relative px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-green-500/25 transition duration-300 transform hover:scale-105 hover:shadow-green-500/40"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Browse Handheld Compatibility
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </span>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400 to-green-600 blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
      </Link>
    </div>
  )
}
