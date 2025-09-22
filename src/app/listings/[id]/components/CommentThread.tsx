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
import { useRecaptchaForComment } from '@/lib/captcha/hooks'
import { type RouterInput } from '@/types/trpc'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

interface Props {
  listingId: string
  initialSortBy?: 'newest' | 'oldest' | 'popular'
  gameId?: string
  systemId?: string
  listingOwnerId?: string
  emulatorId?: string
}

function CommentThread(props: Props) {
  const { user } = useUser()
  const [sortBy, setSortBy] = useState(props.initialSortBy ?? 'newest')
  const { executeForComment, isCaptchaEnabled } = useRecaptchaForComment()

  const listingsQuery = api.listings.getSortedComments.useQuery(
    { listingId: props.listingId, sortBy },
    { enabled: !!props.listingId },
  )

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  const verifiedDeveloper = useVerifiedDeveloper(userQuery.data?.id ?? '', props.emulatorId ?? '')

  const utils = api.useUtils()

  const createComment = api.listings.createComment.useMutation({
    onSuccess: (data) => {
      if (data?.id) {
        analytics.engagement.comment({
          action: 'created',
          commentId: data.id,
          listingId: props.listingId,
          isReply: false,
          contentLength: 0, // We don't have access to content length here
          gameId: props.gameId,
          systemId: props.systemId,
        })
      }
      refreshData()
    },
  })

  const editComment = api.listings.editComment.useMutation({
    onSuccess: () => {
      refreshData()
    },
  })

  const voteComment = api.listings.voteComment.useMutation({
    onSuccess: () => {
      utils.listings.getSortedComments
        .invalidate({ listingId: props.listingId })
        .catch(console.error)
    },
  })

  const deleteComment = api.listings.deleteComment.useMutation({
    onSuccess: () => {
      refreshData()
    },
  })

  const pinCommentMutation = api.listings.pinComment.useMutation({
    onSuccess: () => {
      refreshData()
    },
  })

  const unpinCommentMutation = api.listings.unpinComment.useMutation({
    onSuccess: () => {
      refreshData()
    },
  })

  const refreshData = () => {
    utils.listings.getSortedComments.invalidate({ listingId: props.listingId }).catch(console.error)
  }

  const handlePinComment = async (params: { commentId: string; replaceExisting: boolean }) => {
    await pinCommentMutation.mutateAsync({
      listingId: props.listingId,
      commentId: params.commentId,
      replaceExisting: params.replaceExisting,
    })
  }

  const handleUnpinComment = async () => {
    await unpinCommentMutation.mutateAsync({ listingId: props.listingId })
  }

  const canPinComments = Boolean(
    userQuery.data?.role &&
      (hasRolePermission(userQuery.data.role, Role.MODERATOR) ||
        (userQuery.data.role === Role.DEVELOPER &&
          verifiedDeveloper.isVerifiedDeveloper &&
          props.emulatorId)),
  )

  const threadConfig: CommentThreadConfig = {
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

  const formConfig: CommentFormConfig = {
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
    voteComment.mutate({
      commentId,
      value: isUpvote,
    } satisfies RouterInput['listings']['voteComment'])
  }

  const handleDelete = async (commentId: string) => {
    await deleteComment.mutateAsync({
      commentId,
    } satisfies RouterInput['listings']['deleteComment'])
  }

  const handleCreateComment = async (data: {
    content: string
    parentId?: string
    recaptchaToken?: string | null
  }) => {
    const mutation = createComment.mutateAsync({
      listingId: props.listingId,
      content: data.content,
      parentId: data.parentId,
      ...(data.recaptchaToken && { recaptchaToken: data.recaptchaToken }),
    } satisfies RouterInput['listings']['createComment'])

    // Track analytics for replies
    if (data.parentId) {
      mutation.then((result) => {
        if (!result?.id) return
        analytics.engagement.comment({
          action: 'reply',
          commentId: result.id,
          listingId: props.listingId,
          isReply: true,
          contentLength: data.content.length,
          gameId: props.gameId,
          systemId: props.systemId,
        })
      })
    }

    await mutation
  }

  const handleEditComment = async (data: { commentId: string; content: string }) => {
    await editComment.mutateAsync({
      commentId: data.commentId,
      content: data.content,
    } satisfies RouterInput['listings']['editComment'])

    // Track analytics
    analytics.engagement.comment({
      action: 'edited',
      commentId: data.commentId,
      listingId: props.listingId,
      contentLength: data.content.length,
      gameId: props.gameId,
      systemId: props.systemId,
    })
  }

  return (
    <div className="mt-6">
      <GenericCommentThread
        entityId={props.listingId}
        config={threadConfig}
        comments={listingsQuery.data?.comments ?? []}
        isLoading={listingsQuery.isPending}
        userRole={userQuery.data?.role}
        entityOwnerId={props.listingOwnerId}
        pinnedComment={listingsQuery.data?.pinnedComment ?? null}
        canPin={canPinComments}
        onPin={canPinComments ? handlePinComment : undefined}
        onUnpin={canPinComments ? handleUnpinComment : undefined}
        onRefresh={refreshData}
        onVote={handleVote}
        onDelete={handleDelete}
        onSortChange={(newSort) => setSortBy(newSort as typeof sortBy)}
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
            getRecaptchaToken={isCaptchaEnabled ? executeForComment : undefined}
            isCreating={createComment.isPending}
            isUpdating={editComment.isPending}
          />
        )}
      />
    </div>
  )
}

export default CommentThread
