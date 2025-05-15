'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { VoteButtons } from './components/VoteButtons'
import { CommentForm } from './components/CommentForm'
import { api } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { canEditComment, canDeleteComment } from '@/utils/hasPermission'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ListingDetailsClientProps {
  listing: unknown
  successRate: number
  upVotes: number
  totalVotes: number
  userVote: boolean | null
}

function isComment(obj: unknown): obj is {
  id: string
  content: string
  createdAt: string | Date
  deletedAt?: string | Date | null
  isEdited?: boolean
  user?: { 
    id?: string
    name?: string | null
    profileImage?: string | null 
  }
} {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'content' in obj &&
    'createdAt' in obj
  )
}

export default function ListingDetailsClient(props: ListingDetailsClientProps) {
  const { data: session } = useSession()
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const listingId = (props.listing as { id: string }).id
  const utils = api.useUtils()

  // Use TRPC to get comments
  const { data: commentsData } = api.listings.getComments.useQuery(
    { listingId },
    { enabled: !!listingId }
  )

  const deleteComment = api.listings.deleteComment.useMutation({
    onSuccess: () => {
      refreshData()
    },
  })

  // Function to refresh comments and votes
  const refreshData = () => {
    utils.listings.getComments.invalidate({ listingId }).catch(console.error)
  }

  // Type assertion for listing (from server)
  const l = props.listing as {
    id: string
    game: { title: string; system?: { name?: string } }
    device?: { brand?: string; modelName?: string }
    emulator?: { name?: string }
    performance?: { label?: string }
    notes?: string
    author?: {
      name?: string
      email?: string
      id?: string
      profileImage?: string | null
    }
    comments?: unknown[]
  }

  // Use the comments from the query if available, otherwise use the server-provided ones
  const comments = commentsData?.comments ?? l.comments ?? []

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate({ commentId })
    }
  }

  const renderComment = (comment: unknown, idx: number) => {
    if (!isComment(comment)) return null

    const isEditing = editingCommentId === comment.id
    const isDeleted = !!comment.deletedAt

    const canEdit = session && comment.user?.id && canEditComment(
      session.user.role,
      comment.user.id,
      session.user.id
    )

    const canDelete = session && comment.user?.id && canDeleteComment(
      session.user.role,
      comment.user.id,
      session.user.id
    )

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 * Math.min(idx, 5) }}
        className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
      >
        {isEditing ? (
          <CommentForm
            listingId={listingId}
            commentId={comment.id}
            initialContent={comment.content}
            onCommentSuccess={refreshData}
            onCancelEdit={() => setEditingCommentId(null)}
            isEditing
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-300 dark:bg-indigo-700 flex items-center justify-center text-lg font-bold text-white">
                  {comment.user?.name?.[0] ?? '?'}
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {comment.user?.name ?? 'Anonymous'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400 italic">(edited)</span>
                )}
              </div>
              {!isDeleted && (
                <div className="flex gap-2">
                  {canEdit && (
                    <button
                      onClick={() => setEditingCommentId(comment.id)}
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {isDeleted ? (
                <em className="text-gray-500 dark:text-gray-400">
                  This comment has been deleted.
                </em>
              ) : (
                comment.content
              )}
            </div>
          </>
        )}
      </motion.div>
    )
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
                {l.game.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">System: {l.game.system?.name}</Badge>
                <Badge variant="default">
                  Device: {l.device?.brand} {l.device?.modelName}
                </Badge>
                <Badge variant="default">Emulator: {l.emulator?.name}</Badge>
                <Badge variant="default">
                  Performance: {l.performance?.label}
                </Badge>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Notes
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                  {l.notes ?? 'No notes provided.'}
                </p>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Rating
                </h2>
                <VoteButtons
                  listingId={l.id}
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
                {l.author?.profileImage ? (
                  <Image
                    src={l.author.profileImage}
                    alt={`${l.author?.name ?? 'Author'}'s profile`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                    {l.author?.name?.[0] ?? '?'}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {l.author?.name ?? 'Unknown'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {l.author?.email ?? ''}
                </div>
              </div>
              <Link
                href={`/users/${l.author?.id ?? ''}`}
                className="mt-2 text-indigo-600 hover:underline text-xs"
              >
                View Profile
              </Link>
            </div>
          </div>
          {/* Comments Section */}
          <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Comments
            </h2>

            {/* Add comment form */}
            <CommentForm
              listingId={l.id}
              onCommentSuccess={refreshData}
            />

            <div className="space-y-4">
              {(!comments || comments.length === 0) && (
                <div className="text-gray-500">No comments yet. Be the first to comment!</div>
              )}
              {comments.map((comment, idx) => renderComment(comment, idx))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
