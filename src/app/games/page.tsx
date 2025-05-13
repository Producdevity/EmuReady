import Link from 'next/link'
import { getAllGames } from './data'
import { Badge } from '@/components/ui/badge'

export default async function GamesPage() {
  const games = await getAllGames()

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-white tracking-tight">
          Games Library
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {game.title}
                </h2>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {game.system?.name || 'Unknown System'}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {game._count.listings} {game._count.listings === 1 ? 'listing' : 'listings'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {games.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 dark:text-gray-400">No games found in the database.</p>
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Link
            href="/games/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-lg shadow-md hover:shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-700"
          >
            Add New Game
          </Link>
        </div>
      </div>
    </main>
  )
} 