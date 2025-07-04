'use client'

import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useState } from 'react'
import { useConfirmDialog, TranslatableMarkdown } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'
import { formatTimeAgo } from '@/utils/date'
import { canEditComment, canDeleteComment } from '@/utils/permissions'
import PcCommentForm from './PcCommentForm'

type CommentsData = RouterOutput['pcListings']['getComments']
type TopLevelComment = CommentsData['comments'][number]
type ReplyComment = TopLevelComment['replies'][number]
type AnyComment = TopLevelComment | ReplyComment

type SortBy = 'newest' | 'oldest' | 'score'

interface Props {
  pcListingId: string
  initialSortBy?: SortBy
  gameId?: string
  systemId?: string
}

function PcCommentThread(props: Props) {
  const initialSortBy = props.initialSortBy ?? 'newest'
  const { user } = useUser()
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({})

  const pcListingsQuery = api.pcListings.getComments.useQuery(
    { pcListingId: props.pcListingId, sortBy },
    { enabled: !!props.pcListingId },
  )
  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  const confirmDialog = useConfirmDialog()

  const utils = api.useUtils()

  const deleteCommentMutation = api.pcListings.deleteComment.useMutation({
    onSuccess: () => {
      // Refresh comments after deletion
      utils.pcListings.getComments
        .invalidate({ pcListingId: props.pcListingId })
        .catch(console.error)
    },
  })

  const comments = pcListingsQuery.data?.comments ?? []

  const refreshComments = () => {
    utils.pcListings.getComments
      .invalidate({ pcListingId: props.pcListingId })
      .catch(console.error)
  }

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await confirmDialog({
      title: 'Delete Comment',
      description: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
    })

    if (confirmed) {
      deleteCommentMutation.mutate({ commentId })
    }
  }

  const toggleExpandComment = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const renderComment = (comment: AnyComment, isReply = false) => {
    const canEdit = canEditComment(
      userQuery.data?.role,
      comment.user.id,
      user?.id ?? '',
    )
    const canDelete = canDeleteComment(
      userQuery.data?.role,
      comment.user.id,
      user?.id ?? '',
    )

    const isExpanded = expandedComments[comment.id] ?? false
    const hasReplies = 'replies' in comment && comment.replies.length > 0

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          isReply
            ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4'
            : ''
        } mb-4`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.user.name || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  (edited)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {canEdit && (
                <button
                  onClick={() => setEditingCommentId(comment.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  title="Edit comment"
                >
                  <Pencil size={14} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                  title="Delete comment"
                  disabled={deleteCommentMutation.isPending}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Comment Content */}
          {editingCommentId === comment.id ? (
            <PcCommentForm
              pcListingId={props.pcListingId}
              parentId={undefined}
              editingComment={comment}
              onSuccess={() => {
                setEditingCommentId(null)
                refreshComments()
              }}
              onCancel={() => setEditingCommentId(null)}
            />
          ) : (
            <>
              <TranslatableMarkdown
                content={comment.content}
                className="text-gray-700 dark:text-gray-300 mb-3"
              />

              {/* Comment Actions */}
              <div className="flex items-center gap-4 text-sm">
                {/* Vote score display */}
                <span className="text-gray-500 dark:text-gray-400">
                  {comment.score} points
                </span>

                {/* Reply button */}
                {!isReply && user && (
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id,
                      )
                    }
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    <MessageCircle size={14} />
                    Reply
                  </button>
                )}

                {/* Expand/collapse replies */}
                {hasReplies && (
                  <button
                    onClick={() => toggleExpandComment(comment.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={14} />
                        Hide {comment.replies.length} replies
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        Show {comment.replies.length} replies
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-8 mt-2"
          >
            <PcCommentForm
              pcListingId={props.pcListingId}
              parentId={comment.id}
              onSuccess={() => {
                setReplyingTo(null)
                refreshComments()
              }}
              onCancel={() => setReplyingTo(null)}
            />
          </motion.div>
        )}

        {/* Replies */}
        {hasReplies && isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              {comment.replies.map((reply) => renderComment(reply, true))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    )
  }

  if (pcListingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>

        {/* Sort Options */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="score">Top scored</option>
        </select>
      </div>

      {/* Add Comment Form */}
      {user && (
        <PcCommentForm
          pcListingId={props.pcListingId}
          onSuccess={refreshComments}
        />
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PcCommentThread
