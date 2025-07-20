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
import {
  RoleBadge,
  useConfirmDialog,
  TranslatableMarkdown,
} from '@/components/ui'
import { formatTimeAgo } from '@/utils/date'
import { canEditComment, canDeleteComment } from '@/utils/permissions'
import type { Role } from '@orm'

export interface CommentUser {
  id: string
  name: string | null
  profileImage: string | null
  role?: Role
}

export interface BaseComment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  isEdited: boolean
  deletedAt: Date | null
  score?: number | null
  userVote?: boolean | null
  user: CommentUser
}

export interface CommentWithReplies extends BaseComment {
  replies: BaseComment[]
  replyCount?: number
}

export type AnyComment = BaseComment | CommentWithReplies

export interface CommentThreadConfig {
  // API configuration
  entityIdField: 'listingId' | 'pcListingId'
  entityType: 'listing' | 'pcListing'

  // Feature flags
  enableVoting: boolean
  enableRecaptcha?: boolean
  enableAnalytics?: boolean

  // Sort options
  sortOptions: Array<{
    value: string
    label: string
  }>
  defaultSort: string

  // Styling
  avatarStyle?: 'initials' | 'image'
  replyIndentStyle?: 'line' | 'margin'

  // Additional props for forms
  gameId?: string
  systemId?: string
}

interface GenericCommentThreadProps {
  entityId: string
  config: CommentThreadConfig
  comments: CommentWithReplies[]
  isLoading: boolean
  userRole?: Role

  // Callbacks
  onRefresh: () => void
  onVote?: (commentId: string, isUpvote: boolean) => void
  onDelete: (commentId: string) => Promise<void>
  onSortChange: (sortBy: string) => void

  // Form component
  renderForm: (props: {
    parentId?: string
    editingComment?: AnyComment
    onSuccess: () => void
    onCancel?: () => void
  }) => React.ReactNode
}

export function GenericCommentThread(props: GenericCommentThreadProps) {
  const { user } = useUser()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({})
  const [sortBy, setSortBy] = useState(props.config.defaultSort)

  const confirm = useConfirmDialog()

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await confirm({
      title: 'Delete Comment',
      description: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
    })

    if (confirmed) {
      await props.onDelete(commentId)
    }
  }

  const toggleCommentExpanded = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const isCommentExpanded = (commentId: string, comment: AnyComment) => {
    if (expandedComments[commentId] !== undefined) {
      return expandedComments[commentId]
    }

    // Default to expanded if 3 or fewer replies
    if ('replies' in comment) {
      return comment.replies.length <= 3
    }

    return true
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    props.onSortChange(newSort)
  }

  const renderComment = (comment: AnyComment, level = 0): React.ReactNode => {
    if (!comment) return null

    const isDeleted = !!comment.deletedAt
    const isEditing = editingCommentId === comment.id
    const isReplying = replyingTo === comment.id
    const expanded = isCommentExpanded(comment.id, comment)

    const canEdit = canEditComment(props.userRole, comment.user.id, user?.id)

    const canDelete = canDeleteComment(
      props.userRole,
      comment.user.id,
      user?.id,
    )

    const leftMargin = level > 0 ? `ml-${Math.min(level * 4, 12)}` : ''
    const borderStyle =
      level > 0 && props.config.replyIndentStyle === 'line'
        ? 'border-l-2 border-gray-200 dark:border-gray-700 pl-4'
        : ''

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
          props.renderForm({
            editingComment: comment,
            onSuccess: () => {
              setEditingCommentId(null)
              props.onRefresh()
            },
            onCancel: () => setEditingCommentId(null),
          })
        ) : (
          <div
            id={`comment-${comment.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Comment header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {props.config.avatarStyle === 'initials' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-300 dark:bg-indigo-700 flex items-center justify-center text-lg font-bold text-white">
                    {comment.user?.name?.[0] ?? '?'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {comment.user?.name ?? 'Anonymous'}
                    </span>
                    {comment.user?.role && (
                      <RoleBadge role={comment.user.role} size="sm" />
                    )}
                  </div>

                  <span className="text-xs text-gray-400">
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
                      type="button"
                      onClick={() => setEditingCommentId(comment.id)}
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
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
            <div className="mb-3">
              {isDeleted ? (
                <em className="text-gray-500 dark:text-gray-400">
                  This comment has been deleted.
                </em>
              ) : (
                <TranslatableMarkdown
                  content={comment.content}
                  className="text-gray-700 dark:text-gray-300"
                  preserveWhitespace={false}
                />
              )}
            </div>

            {/* Comment actions */}
            {!isDeleted && (
              <div className="flex items-center justify-between text-sm">
                {/* Vote controls */}
                {props.config.enableVoting && props.onVote && (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => props.onVote!(comment.id, true)}
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
                      type="button"
                      onClick={() => props.onVote!(comment.id, false)}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        comment.userVote === false
                          ? 'text-red-500'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* For PC listings without voting, show score */}
                {!props.config.enableVoting && comment.score !== undefined && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {comment.score} points
                  </span>
                )}

                {/* Reply and expand/collapse */}
                <div className="flex items-center space-x-2">
                  {/* Reply button */}
                  {user && level === 0 && (
                    <button
                      type="button"
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
                  )}

                  {/* Expand/collapse replies */}
                  {hasReplies && (
                    <button
                      type="button"
                      onClick={() => toggleCommentExpanded(comment.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center ml-2"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
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
              {props.renderForm({
                parentId: comment.id,
                onSuccess: () => {
                  setReplyingTo(null)
                  props.onRefresh()
                },
                onCancel: () => setReplyingTo(null),
              })}
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

  if (props.isLoading) {
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
          Comments ({props.comments.length})
        </h3>

        {/* Sort Options */}
        {props.comments.length > 0 && (
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {props.config.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Add Comment Form */}
      {user && props.renderForm({ onSuccess: props.onRefresh })}

      {/* Comments List */}
      <div className="space-y-4">
        {props.comments.length > 0 ? (
          props.comments.map((comment) => renderComment(comment))
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
