'use client'

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import {
  GenericCommentThread,
  GenericCommentForm,
  type CommentThreadConfig,
  type CommentFormConfig,
} from '@/components/comments'
import useVerifiedDeveloper from '@/hooks/useVerifiedDeveloper'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useListingApi, type ListingType } from '@/lib/api/useListingApi'
import { useRecaptchaForComment } from '@/lib/captcha/hooks'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

type HandheldSort = 'newest' | 'oldest' | 'popular'
type PcSort = 'newest' | 'oldest' | 'score'
type CommentSort = HandheldSort | PcSort

const COMMENT_SORT_VALUES: ReadonlySet<string> = new Set<CommentSort>([
  'newest',
  'oldest',
  'popular',
  'score',
])

function isCommentSort(value: string): value is CommentSort {
  return COMMENT_SORT_VALUES.has(value)
}

interface Props {
  listingId: string
  listingType: ListingType
  initialSortBy?: CommentSort
  gameId?: string
  systemId?: string
  listingOwnerId?: string
  emulatorId?: string
}

function CommentThread(props: Props) {
  const isPc = props.listingType === 'pc'

  const { user } = useUser()
  const [sortBy, setSortBy] = useState<CommentSort>(props.initialSortBy ?? 'newest')
  const { executeForComment, isCaptchaEnabled } = useRecaptchaForComment()
  const listingApi = useListingApi(props.listingType)

  const commentsQuery = listingApi.useCommentsQuery({
    listingId: props.listingId,
    sortBy,
  })

  const userQuery = api.users.me.useQuery(undefined, { enabled: !!user })

  const verifiedDeveloper = useVerifiedDeveloper(userQuery.data?.id ?? '', props.emulatorId ?? '')

  const utils = api.useUtils()

  const refreshData = () => {
    if (isPc) {
      utils.pcListings.getComments.invalidate({ pcListingId: props.listingId }).catch(console.error)
    } else {
      utils.listings.getSortedComments
        .invalidate({ listingId: props.listingId })
        .catch(console.error)
    }
  }

  const handlePinComment = async (params: { commentId: string; replaceExisting: boolean }) => {
    listingApi.pinComment(
      {
        listingId: props.listingId,
        commentId: params.commentId,
        replaceExisting: params.replaceExisting,
      },
      { onSuccess: refreshData },
    )
  }

  const handleUnpinComment = async () => {
    listingApi.unpinComment({ listingId: props.listingId }, { onSuccess: refreshData })
  }

  const canPinComments = Boolean(
    userQuery.data?.role &&
      (hasRolePermission(userQuery.data.role, Role.MODERATOR) ||
        (userQuery.data.role === Role.DEVELOPER &&
          verifiedDeveloper.isVerifiedDeveloper &&
          props.emulatorId)),
  )

  const threadConfig: CommentThreadConfig = isPc
    ? {
        entityIdField: 'pcListingId',
        entityType: 'pcListing',
        enableVoting: false,
        sortOptions: [
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
          { value: 'score', label: 'Top scored' },
        ],
        defaultSort: 'newest',
        avatarStyle: undefined,
        replyIndentStyle: 'margin',
      }
    : {
        entityIdField: 'listingId',
        entityType: 'listing',
        enableVoting: true,
        enableRecaptcha: true,
        enableAnalytics: true,
        sortOptions: [
          { value: 'newest', label: 'Newest' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'popular', label: 'Popular' },
        ],
        defaultSort: 'newest',
        avatarStyle: 'initials',
        replyIndentStyle: 'line',
        gameId: props.gameId,
        systemId: props.systemId,
      }

  const formConfig: CommentFormConfig = isPc
    ? {
        entityType: 'pcListing',
        placeholders: {
          comment: 'Share your thoughts about this PC configuration...',
          reply: 'Write your reply...',
        },
        maxLength: 2000,
        enableRecaptcha: false,
        showSignInPrompt: false,
        buttonStyle: 'compact',
      }
    : {
        entityType: 'listing',
        placeholders: {
          comment: 'Write your comment...',
          reply: 'Write your reply...',
        },
        maxLength: 1000,
        enableRecaptcha: isCaptchaEnabled,
        showSignInPrompt: true,
        buttonStyle: 'default',
      }

  const handleVote = (commentId: string, isUpvote: boolean) => {
    listingApi.voteComment({ commentId, value: isUpvote }, { onSuccess: refreshData })
  }

  const handleDelete = async (commentId: string) => {
    listingApi.deleteComment({ commentId }, { onSuccess: refreshData })
  }

  const handleCreateComment = async (data: {
    content: string
    parentId?: string
    recaptchaToken?: string | null
  }) => {
    return new Promise<void>((resolve, reject) => {
      listingApi.createComment(
        {
          listingId: props.listingId,
          content: data.content,
          parentId: data.parentId,
          recaptchaToken: data.recaptchaToken ?? null,
        },
        {
          onSuccess: (result) => {
            refreshData()
            if (!isPc && data.parentId && (result as { id?: string } | null)?.id) {
              analytics.engagement.comment({
                action: 'reply',
                commentId: (result as { id: string }).id,
                listingId: props.listingId,
                isReply: true,
                contentLength: data.content.length,
                gameId: props.gameId,
                systemId: props.systemId,
              })
            }
            resolve()
          },
          onError: (err) => reject(err),
        },
      )
    })
  }

  const handleEditComment = async (data: { commentId: string; content: string }) => {
    return new Promise<void>((resolve, reject) => {
      listingApi.updateComment(
        { commentId: data.commentId, content: data.content },
        {
          onSuccess: () => {
            refreshData()
            if (!isPc) {
              analytics.engagement.comment({
                action: 'edited',
                commentId: data.commentId,
                listingId: props.listingId,
                contentLength: data.content.length,
                gameId: props.gameId,
                systemId: props.systemId,
              })
            }
            resolve()
          },
          onError: (err) => reject(err),
        },
      )
    })
  }

  return (
    <div className="mt-6">
      <GenericCommentThread
        entityId={props.listingId}
        config={threadConfig}
        comments={commentsQuery.data?.comments ?? []}
        isLoading={commentsQuery.isPending}
        userRole={userQuery.data?.role}
        entityOwnerId={props.listingOwnerId}
        pinnedComment={commentsQuery.data?.pinnedComment ?? null}
        canPin={canPinComments}
        onPin={canPinComments ? handlePinComment : undefined}
        onUnpin={canPinComments ? handleUnpinComment : undefined}
        onRefresh={refreshData}
        onVote={isPc ? undefined : handleVote}
        onDelete={handleDelete}
        onSortChange={(newSort) => {
          if (isCommentSort(newSort)) setSortBy(newSort)
        }}
        renderForm={({ parentId, editingComment, onSuccess, onCancel }) => (
          <GenericCommentForm
            entityId={props.listingId}
            parentId={parentId}
            editingComment={editingComment}
            config={formConfig}
            onSubmit={handleCreateComment}
            onUpdate={handleEditComment}
            onSuccess={onSuccess}
            onCancel={onCancel}
            getRecaptchaToken={!isPc && isCaptchaEnabled ? executeForComment : undefined}
            isCreating={listingApi.isCreateCommentPending}
            isUpdating={listingApi.isUpdateCommentPending}
          />
        )}
      />
    </div>
  )
}

export default CommentThread
