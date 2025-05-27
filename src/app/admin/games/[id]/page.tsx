import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { prisma } from '@/server/db'
import GameEditForm from './components/GameEditForm'
import GameRelatedData from './components/GameRelatedData'

interface Props {
  params: Promise<{ id: string }>
}

async function getGameData(id: string) {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      system: {
        include: {
          emulators: true,
        },
      },
      listings: {
        include: {
          device: {
            include: {
              brand: true,
            },
          },
          emulator: true,
          performance: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!game) return null

  return game
}

async function AdminGameEditPage(props: Props) {
  const { id } = await props.params
  const game = await getGameData(id)

  if (!game) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/games">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Game: {game.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Game Details
            </h2>
            <GameEditForm game={game} />
          </div>

          <GameRelatedData game={game} />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href={`/games/${game.id}`} target="_blank">
                  View Public Page
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href={`/listings/new?gameId=${game.id}`}>
                  Add New Listing
                </Link>
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Compatible Emulators
            </h3>
            {game.system.emulators.length > 0 ? (
              <ul className="space-y-2">
                {game.system.emulators.map((emulator) => (
                  <li key={emulator.id}>
                    <Link
                      href={`/admin/emulators/${emulator.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {emulator.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No emulators support this system yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminGameEditPage
