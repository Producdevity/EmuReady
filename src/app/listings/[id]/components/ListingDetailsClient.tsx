'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Card, Badge } from '@/components/ui'
import VoteButtons from './VoteButtons'
import CommentThread from './CommentThread'
import { api } from '@/lib/api'

export interface Listing {
  id: string
  game: { title: string; system?: { name?: string } }
  device?: { brand?: string; modelName?: string }
  emulator?: { name?: string }
  performance?: { label?: string }
  notes?: string | null
  author?: {
    name?: string | null
    email?: string
    id?: string
    profileImage?: string | null
  }
}

interface Props {
  listing: Listing
  successRate: number
  upVotes: number
  totalVotes: number
  userVote: boolean | null
}

function ListingDetailsClient(props: Props) {
  const listingId = props.listing.id
  const utils = api.useUtils()

  const refreshData = () => {
    // TODO: handle errors
    utils.listings.byId.invalidate({ id: listingId }).catch(console.error)
  }

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
                {props.listing?.game.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">
                  System: {props.listing?.game.system?.name}
                </Badge>
                <Badge variant="default">
                  Device: {props.listing?.device?.brand}{' '}
                  {props.listing?.device?.modelName}
                </Badge>
                <Badge variant="default">
                  Emulator: {props.listing?.emulator?.name}
                </Badge>
                <Badge variant="default">
                  Performance: {props.listing?.performance?.label}
                </Badge>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notes
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                  {props.listing?.notes ?? 'No notes provided.'}
                </p>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Rating
                </h2>
                <VoteButtons
                  listingId={props.listing?.id}
                  currentVote={props.userVote}
                  upVoteCount={props.upVotes}
                  totalVotes={props.totalVotes}
                  onVoteSuccess={refreshData}
                />
              </div>
            </div>
            {/* Author Info */}
            <div className="flex flex-col items-center gap-2 min-w-[140px]">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-indigo-200 dark:bg-indigo-800">
                {props.listing?.author?.profileImage ? (
                  <Image
                    src={props.listing?.author.profileImage}
                    alt={`${props.listing?.author?.name ?? 'Author'}'s profile`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                    {props.listing?.author?.name?.[0] ?? '?'}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {props.listing?.author?.name ?? 'Unknown'}
                </div>
              </div>
              <Link
                href={`/users/${props.listing?.author?.id ?? ''}`}
                className="mt-2 text-indigo-600 hover:underline text-xs"
              >
                View Profile
              </Link>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
            <CommentThread
              listingId={props.listing?.id}
              initialSortBy="newest"
            />
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default ListingDetailsClient
