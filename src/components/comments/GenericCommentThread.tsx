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
  Pin,
  PinOff,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  RoleBadge,
  useConfirmDialog,
  TranslatableMarkdown,
  LocalizedDate,
  Dropdown,
} from '@/components/ui'
import { hasRolePermission, canEditComment, canDeleteComment } from '@/utils/permissions'
import { Role } from '@orm'

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

export interface PinnedCommentData {
  comment: AnyComment
  isReply: boolean
  parentId: string | null
  pinnedBy?: CommentUser | null
  pinnedAt?: Date | null
}

export interface CommentThreadConfig {
  // API configuration
  entityIdField: 'listingId' | 'pcListingId'
  entityType: 'listing' | 'pcListing'

  // Feature flags
  enableVoting: boolean
  enableRecaptcha?: boolean
  enableAnalytics?: boolean

  // Sort options
  sortOptions: {
    value: string
    label: string
  }[]
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
  entityOwnerId?: string // ID of the listing/PC listing owner
  pinnedComment?: PinnedCommentData | null
  canPin?: boolean
  onPin?: (params: { commentId: string; replaceExisting: boolean }) => Promise<void>
  onUnpin?: () => Promise<void>

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
  }) => ReactNode
}

export function GenericCommentThread(props: GenericCommentThreadProps) {
  const { user } = useUser()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
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
    if (expandedComments[commentId] !== undefined) return expandedComments[commentId]

    // Default to expanded if 3 or fewer replies
    if ('replies' in comment) return comment.replies.length <= 3

    return true
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    props.onSortChange(newSort)
  }

  const viewerCanSeePinnedMeta = hasRolePermission(props.userRole, Role.MODERATOR)
  const totalTopLevelCount =
    props.comments.length + (props.pinnedComment && !props.pinnedComment.isReply ? 1 : 0)

  const renderComment = (
    comment: AnyComment,
    level = 0,
    options: { context?: 'default' | 'pinned'; keyOverride?: string } = {},
  ): ReactNode => {
    if (!comment) return null

    const isDeleted = !!comment.deletedAt
    const isEditing = editingCommentId === comment.id
    const isReplying = replyingTo === comment.id
    const expanded = isCommentExpanded(comment.id, comment)

    const canEdit = canEditComment(props.userRole, comment.user.id, user?.id)

    const canDelete = canDeleteComment(props.userRole, comment.user.id, user?.id)

    const isPinned = props.pinnedComment?.comment.id === comment.id
    const showPinControl = props.canPin && (isPinned ? props.onUnpin : props.onPin)

    const leftMargin = level > 0 ? `ml-${Math.min(level * 4, 12)}` : ''
    const borderStyle =
      level > 0 && props.config.replyIndentStyle === 'line'
        ? 'border-l-2 border-gray-200 dark:border-gray-700 pl-4'
        : ''

    const hasReplies = 'replies' in comment && comment.replies && comment.replies.length > 0

    const containerMargin = options.context === 'pinned' ? '' : 'mb-4'
    const commentDomId =
      options.context === 'pinned' ? `pinned-comment-${comment.id}` : `comment-${comment.id}`

    const handlePinToggle = async () => {
      if (!props.canPin) return

      if (isPinned) {
        if (!props.onUnpin) return
        const confirmed = await confirm({
          title: 'Unpin Comment',
          description: 'This comment is currently pinned. Do you want to unpin it?',
          confirmText: 'Unpin',
        })

        if (!confirmed) return
        await props.onUnpin()
        return
      }

      if (!props.onPin) return

      const hasDifferentPinned =
        props.pinnedComment && props.pinnedComment.comment.id !== comment.id
      const confirmed = await confirm({
        title: hasDifferentPinned ? 'Replace Pinned Comment' : 'Pin Comment',
        description: hasDifferentPinned
          ? 'A different comment is already pinned. Do you want to unpin it and pin this comment instead?'
          : 'Pin this comment so it appears at the top of the discussion?',
        confirmText: hasDifferentPinned ? 'Replace' : 'Pin',
      })

      if (!confirmed) return

      await props.onPin({
        commentId: comment.id,
        replaceExisting: Boolean(hasDifferentPinned),
      })
    }

    return (
      <motion.div
        key={options.keyOverride ?? comment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${containerMargin} ${leftMargin} ${borderStyle}`.trim()}
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
            id={commentDomId}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md ${
              isPinned ? 'ring-2 ring-amber-200 dark:ring-amber-400/50' : ''
            }`}
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

                    {/* Show OP badge if comment author is the listing/PC listing owner */}
                    {props.entityOwnerId && comment.user?.id === props.entityOwnerId && (
                      <span className="px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        OP
                      </span>
                    )}

                    {comment.user?.role && <RoleBadge role={comment.user.role} size="sm" />}

                    {isPinned && (
                      <span className="px-1.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 rounded">
                        Pinned
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400">
                    <LocalizedDate date={comment.createdAt} format="timeAgo" />
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-gray-400 italic ml-1">(edited)</span>
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
                  {showPinControl && (
                    <button
                      type="button"
                      onClick={handlePinToggle}
                      className={`text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-300 ${
                        isPinned ? 'text-amber-600 dark:text-amber-200' : ''
                      }`}
                      aria-label={isPinned ? 'Unpin comment' : 'Pin comment'}
                    >
                      {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Comment content */}
            <div className="mb-3">
              {isDeleted ? (
                <em className="text-gray-500 dark:text-gray-400">This comment has been deleted.</em>
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
                  <span className="text-gray-500 dark:text-gray-400">{comment.score} points</span>
                )}

                {/* Reply and expand/collapse */}
                <div className="flex items-center space-x-2">
                  {/* Reply button - allow replies at any level */}
                  {user && (
                    <button
                      type="button"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
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
                {comment.replies.map((reply) => renderComment(reply, level + 1))}
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
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({totalTopLevelCount})
        </h3>

        {/* Sort Options */}
        {totalTopLevelCount > 0 && (
          <Dropdown
            options={props.config.sortOptions}
            value={sortBy}
            onChange={handleSortChange}
            className="min-w-[150px]"
          />
        )}
      </div>

      {/* Add Comment Form */}
      {user && props.renderForm({ onSuccess: props.onRefresh })}

      {props.pinnedComment && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-200 uppercase tracking-wide">
            <Pin className="h-4 w-4" />
            {props.pinnedComment.isReply ? 'Pinned Reply' : 'Pinned Comment'}
          </div>
          {viewerCanSeePinnedMeta &&
            (props.pinnedComment.pinnedBy || props.pinnedComment.pinnedAt) && (
              <div className="text-xs text-amber-700 dark:text-amber-200">
                {props.pinnedComment.pinnedBy && (
                  <span>
                    Pinned by {props.pinnedComment.pinnedBy.name ?? 'Unknown'}
                    {props.pinnedComment.pinnedAt ? ' • ' : ''}
                  </span>
                )}
                {props.pinnedComment.pinnedAt && (
                  <LocalizedDate date={props.pinnedComment.pinnedAt} format="timeAgo" />
                )}
              </div>
            )}
          <div>
            {renderComment(props.pinnedComment.comment, 0, {
              context: 'pinned',
              keyOverride: `pinned-${props.pinnedComment.comment.id}`,
            })}
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {props.comments.length > 0 ? (
          props.comments.map((comment) => renderComment(comment))
        ) : !props.pinnedComment ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
