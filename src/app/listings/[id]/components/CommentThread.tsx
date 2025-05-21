'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import CommentForm from './CommentForm'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import { canEditComment, canDeleteComment } from '@/utils/hasPermission'

// TODO: use type from api
interface CommentType {
  id: string
  content: string
  createdAt: string | Date
  updatedAt: string | Date
  deletedAt?: string | Date | null
  isEdited?: boolean
  score?: number
  userVote?: boolean | null
  replyCount?: number
  user?: {
    id?: string
    name?: string | null
    profileImage?: string | null
  }
  replies?: CommentType[]
}

type SortBy = 'newest' | 'oldest' | 'popular'

interface Props {
  listingId: string
  initialSortBy?: SortBy
}

function CommentThread(props: Props) {
  const initialSortBy = props.initialSortBy ?? 'newest'
  const { data: session } = useSession()
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({})

  const { data: commentsData, isLoading } =
    api.listings.getSortedComments.useQuery(
      { listingId: props.listingId, sortBy },
      { enabled: !!props.listingId },
    )

  const voteComment = api.listings.voteComment.useMutation({
    onSuccess: () => {
      // TODO: handle errors
      utils.listings.getSortedComments
        .invalidate({
          listingId: props.listingId,
          sortBy,
        })
        .catch(console.error)
    },
  })

  const deleteComment = api.listings.deleteComment.useMutation({
    onSuccess: () => {
      refreshData()
    },
  })

  const utils = api.useUtils()

  const refreshData = () => {
    // TODO: handle errors
    utils.listings.getSortedComments
      .invalidate({
        listingId: props.listingId,
        sortBy,
      })
      .catch(console.error)
    setReplyingTo(null)
    setEditingCommentId(null)
  }

  const handleVote = (commentId: string, isUpvote: boolean) => {
    if (!session) return
    voteComment.mutate({ commentId, value: isUpvote })
  }

  const toggleCommentExpanded = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate({ commentId })
    }
  }

  const formatRelativeTime = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const isCommentExpanded = (commentId: string) => {
    if (expandedComments[commentId] === undefined) {
      const comment = commentsData?.comments.find((c) => c.id === commentId)
      return !comment || (comment.replies?.length ?? 0) <= 3
    }

    return expandedComments[commentId]
  }

  const renderComment = (comment: CommentType, level = 0) => {
    if (!comment) return null

    const isDeleted = !!comment.deletedAt
    const isEditing = editingCommentId === comment.id
    const isReplying = replyingTo === comment.id
    const expanded = isCommentExpanded(comment.id)

    const canEdit =
      session &&
      comment.user?.id &&
      canEditComment(session.user.role, comment.user.id, session.user.id)

    const canDelete =
      session &&
      comment.user?.id &&
      canDeleteComment(session.user.role, comment.user.id, session.user.id)

    // Determine appropriate left margin for nesting
    const leftMargin = level > 0 ? `ml-${Math.min(level * 4, 12)}` : ''

    // Add border for nested comments
    const borderStyle =
      level > 0 ? 'border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-4 ${leftMargin} ${borderStyle}`}
      >
        {isEditing ? (
          <CommentForm
            listingId={props.listingId}
            commentId={comment.id}
            initialContent={comment.content}
            onCommentSuccess={refreshData}
            onCancelEdit={() => setEditingCommentId(null)}
            isEditing
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md">
            {/* Comment header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-300 dark:bg-indigo-700 flex items-center justify-center text-lg font-bold text-white">
                  {comment.user?.name?.[0] ?? '?'}
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {comment.user?.name ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-gray-400 italic ml-1">
                      (edited)
                    </span>
                  )}
                </div>
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

            {/* Comment content */}
            <div className="text-gray-700 dark:text-gray-300 mb-3">
              {isDeleted ? (
                <em className="text-gray-500 dark:text-gray-400">
                  This comment has been deleted.
                </em>
              ) : (
                comment.content
              )}
            </div>

            {/* Comment actions (vote, reply) */}
            {!isDeleted && (
              <div className="flex items-center justify-between text-sm">
                {/* Vote controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleVote(comment.id, true)}
                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      comment.userVote === true
                        ? 'text-blue-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>

                  <span
                    className={`font-medium ${
                      (comment.score ?? 0) > 0
                        ? 'text-blue-500'
                        : (comment.score ?? 0) < 0
                          ? 'text-red-500'
                          : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {comment.score ?? 0}
                  </span>

                  <button
                    onClick={() => handleVote(comment.id, false)}
                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      comment.userVote === false
                        ? 'text-red-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Reply button */}
                <div className="flex items-center space-x-2">
                  {/* Reply toggle button */}
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id,
                      )
                    }
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                    <span>Reply</span>
                  </button>

                  {/* Show collapse/expand button if comment has replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <button
                      onClick={() => toggleCommentExpanded(comment.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center ml-2"
                    >
                      {expanded ? (
                        <ChevronDownIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-1" />
                      )}
                      <span>
                        {expanded ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                        {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reply form */}
        <AnimatePresence>
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 ml-8"
            >
              <CommentForm
                listingId={props.listingId}
                parentId={comment.id}
                onCommentSuccess={refreshData}
                onCancelEdit={() => setReplyingTo(null)}
                isReply
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies */}
        {!isDeleted && comment.replies && comment.replies.length > 0 && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                {comment.replies.map((reply) =>
                  renderComment(reply, level + 1),
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    )
  }

  // Sorting controls component
  const SortControls = () => (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg inline-flex p-1">
        <button
          onClick={() => setSortBy('newest')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'newest'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => setSortBy('oldest')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'oldest'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          Oldest
        </button>
        <button
          onClick={() => setSortBy('popular')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'popular'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          Popular
        </button>
      </div>
    </div>
  )

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Comments {commentsData?.comments && `(${commentsData.comments.length})`}
      </h2>

      {/* Comment form */}
      <CommentForm listingId={props.listingId} onCommentSuccess={refreshData} />

      {/* Sort controls */}
      {commentsData?.comments && commentsData.comments.length > 0 && (
        <SortControls />
      )}

      {/* Comments list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-gray-500 dark:text-gray-400 animate-pulse">
            Loading comments...
          </div>
        ) : (
          <>
            {(!commentsData?.comments ||
              commentsData.comments.length === 0) && (
              <div className="text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </div>
            )}

            {commentsData?.comments?.map((comment) => renderComment(comment))}
          </>
        )}
      </div>
    </div>
  )
}

export default CommentThread
