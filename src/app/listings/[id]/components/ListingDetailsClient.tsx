'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import { api } from '@/lib/api'
import CommentThread from './CommentThread'
import VoteButtons from './VoteButtons'

export interface Listing {
  id: string
  game: { title: string; system?: { name?: string } }
  device?: {
    brand?: { name?: string }
    modelName?: string
  }
  emulator?: { name?: string }
  performance?: { label?: string }
  notes?: string | null
  author?: {
    name?: string | null
    email?: string
    id?: string
    profileImage?: string | null
  }
  customFieldValues?: Array<{
    id: string
    value: unknown
    customFieldDefinition: {
      id: string
      label: string
      name: string
      type: string
      options?: unknown
    }
  }>
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

  const renderCustomFieldValue = (
    fieldValue: NonNullable<Props['listing']['customFieldValues']>[0],
  ) => {
    const { value, customFieldDefinition } = fieldValue

    switch (customFieldDefinition.type) {
      case 'BOOLEAN':
        return (
          <Badge variant={value ? 'success' : 'default'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        )
      case 'SELECT':
        // For select fields, try to find the label from options
        if (Array.isArray(customFieldDefinition.options)) {
          const option = (
            customFieldDefinition.options as Array<{
              value: string
              label: string
            }>
          ).find((opt) => opt.value === String(value))
          return option?.label ?? String(value)
        }
        return String(value)
      case 'URL':
        if (typeof value === 'string' && value.trim()) {
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {value}
            </a>
          )
        }
        return String(value)
      case 'TEXT':
      case 'TEXTAREA':
      default:
        return String(value ?? '')
    }
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
            <div className="flex-1 pr-8 border-r border-gray-200 dark:border-gray-700 ">
              <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-2">
                {props.listing?.game.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">
                  System: {props.listing?.game.system?.name}
                </Badge>
                <Badge variant="default">
                  Device: {props.listing?.device?.brand?.name}{' '}
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

              {/* Custom Fields Section */}
              {props.listing?.customFieldValues &&
                props.listing.customFieldValues.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      Emulator-Specific Details
                    </h2>
                    <div className="space-y-3">
                      {props.listing.customFieldValues.map((fieldValue) => (
                        <div
                          key={fieldValue.id}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                              {fieldValue.customFieldDefinition.label}:
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {renderCustomFieldValue(fieldValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    unoptimized
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
