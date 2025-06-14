'use client'

import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterOutput, type RouterInput } from '@/types/trpc'
import { formatTimeAgo } from '@/utils/date'
import { canEditComment, canDeleteComment } from '@/utils/permissions'
import CommentForm from './CommentForm'

type CommentsData = RouterOutput['listings']['getSortedComments']
type TopLevelComment = CommentsData['comments'][number]
type ReplyComment = TopLevelComment['replies'][number]
type AnyComment = TopLevelComment | ReplyComment

type SortBy = 'newest' | 'oldest' | 'popular'

interface Props {
  listingId: string
  initialSortBy?: SortBy
}

function CommentThread(props: Props) {
  const initialSortBy = props.initialSortBy ?? 'newest'
  const { user } = useUser()
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({})

  const listingsQuery = api.listings.getSortedComments.useQuery(
    { listingId: props.listingId, sortBy },
    { enabled: !!props.listingId },
  )
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

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
    utils.listings.getSortedComments
      .invalidate({ listingId: props.listingId, sortBy })
      .catch(console.error)
    setReplyingTo(null)
    setEditingCommentId(null)
  }

  const handleVote = (commentId: string, isUpvote: boolean) => {
    voteComment.mutate({
      commentId,
      value: isUpvote,
    } satisfies RouterInput['listings']['voteComment'])
  }

  const toggleCommentExpanded = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const confirm = useConfirmDialog()

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await confirm({
      title: 'Delete Comment',
      description: 'Are you sure you want to delete this comment?',
    })

    if (!confirmed) return

    deleteComment.mutate({
      commentId,
    } satisfies RouterInput['listings']['deleteComment'])
  }

  const isCommentExpanded = (commentId: string) => {
    if (expandedComments[commentId] === undefined) {
      const comment = listingsQuery.data?.comments.find(
        (c) => c.id === commentId,
      )
      return !comment || (comment.replies?.length ?? 0) <= 3
    }

    return expandedComments[commentId]
  }

  const renderComment = (comment: AnyComment, level = 0) => {
    if (!comment) return null

    const isDeleted = !!comment.deletedAt
    const isEditing = editingCommentId === comment.id
    const isReplying = replyingTo === comment.id
    const expanded = isCommentExpanded(comment.id)

    const canEdit = canEditComment(
      userQuery.data?.role,
      comment.user.id,
      user?.id,
    )

    const canDelete = canDeleteComment(
      userQuery.data?.role,
      comment.user.id,
      user?.id,
    )

    const leftMargin = level > 0 ? `ml-${Math.min(level * 4, 12)}` : ''
    const borderStyle =
      level > 0 ? 'border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''

    // Check if this comment has replies (only top-level comments have replies)
    const hasReplies =
      'replies' in comment && comment.replies && comment.replies.length > 0

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
                    {formatTimeAgo(comment.createdAt)}
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
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
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
                    <ChevronUp className="h-4 w-4" />
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
                    <ChevronDown className="h-4 w-4" />
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
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span>Reply</span>
                  </button>

                  {/* Show collapse/expand button if comment has replies */}
                  {hasReplies && (
                    <button
                      onClick={() => toggleCommentExpanded(comment.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center ml-2"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                      )}
                      <span>
                        {expanded ? 'Hide' : 'Show'}{' '}
                        {hasReplies ? comment.replies.length : 0}{' '}
                        {hasReplies && comment.replies.length === 1
                          ? 'reply'
                          : 'replies'}
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
        {!isDeleted && hasReplies && (
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                {hasReplies &&
                  comment.replies.map((reply) =>
                    renderComment(reply, level + 1),
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    )
  }

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
        Comments{' '}
        {listingsQuery.data?.comments &&
          `(${listingsQuery.data.comments.length})`}
      </h2>

      <CommentForm listingId={props.listingId} onCommentSuccess={refreshData} />

      {listingsQuery.data?.comments &&
        listingsQuery.data.comments.length > 0 && <SortControls />}

      <div className="space-y-2">
        {listingsQuery.isLoading ? (
          <div className="text-gray-500 dark:text-gray-400 animate-pulse">
            Loading comments...
          </div>
        ) : (
          <>
            {(!listingsQuery.data?.comments ||
              listingsQuery.data.comments.length === 0) && (
              <div className="text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </div>
            )}

            {listingsQuery.data?.comments?.map((comment) =>
              renderComment(comment),
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CommentThread
