import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { prisma } from '@/server/db'

interface ListingComment {
  id: string
  content: string
  createdAt: string | Date
  user?: { id: string; name: string | null }
}

export default async function ListingDetailsPage({ params }: { params: { id: string } }) {
  // Fetch the listing directly from the database using Prisma
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      game: { include: { system: true } },
      device: true,
      emulator: true,
      performance: true,
      author: { select: { id: true, name: true, email: true } },
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { id: true, name: true } },
          replies: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { votes: true } },
      votes: false, // not needed for this page
    },
  })

  if (!listing) notFound()

  // Calculate success rate
  const upVotes = await prisma.vote.count({ where: { listingId: listing.id, value: true } })
  const totalVotes = listing._count.votes
  const successRate = totalVotes > 0 ? upVotes / totalVotes : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 py-10 px-4 flex justify-center items-start">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <Card className="p-8 shadow-2xl rounded-3xl border-0 bg-white dark:bg-gray-900">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Game Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-2">
                {listing.game.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">System: {listing.game.system?.name}</Badge>
                <Badge variant="secondary">Device: {listing.device?.brand} {listing.device?.modelName}</Badge>
                <Badge variant="secondary">Emulator: {listing.emulator?.name}</Badge>
                <Badge variant="secondary">Performance: {listing.performance?.label}</Badge>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">Notes</h2>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                  {listing.notes || 'No notes provided.'}
                </p>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">Success Rate</h2>
                <motion.div
                  className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(successRate * 100)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                  <div className="h-full bg-green-500" style={{ width: `${Math.round(successRate * 100)}%` }} />
                </motion.div>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 inline-block">
                  {Math.round(successRate * 100)}% success
                </span>
              </div>
            </div>
            {/* Author Info */}
            <div className="flex flex-col items-center gap-2 min-w-[140px]">
              <div className="w-16 h-16 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                {listing.author?.name?.[0] || '?'}
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {listing.author?.name || 'Unknown'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {listing.author?.email || ''}
                </div>
              </div>
              <Link href={`/profile/${listing.author?.id || ''}`} className="mt-2 text-indigo-600 hover:underline text-xs">
                View Profile
              </Link>
            </div>
          </div>
          {/* Comments Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Comments</h2>
            <div className="space-y-4">
              {listing.comments?.length === 0 && (
                <div className="text-gray-500">No comments yet.</div>
              )}
              {listing.comments?.map((comment: ListingComment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-300 dark:bg-indigo-700 flex items-center justify-center text-lg font-bold text-white">
                      {comment.user?.name?.[0] || '?'}
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{comment.user?.name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 