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
import { api } from '@/lib/api'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

interface Props {
  pcListingId: string
  initialSortBy?: 'newest' | 'oldest' | 'score'
  gameId?: string
  systemId?: string
  pcListingOwnerId?: string
  emulatorId?: string
}

function PcCommentThread(props: Props) {
  const { user } = useUser()
  const [sortBy, setSortBy] = useState(props.initialSortBy ?? 'newest')

  const pcListingsQuery = api.pcListings.getComments.useQuery(
    { pcListingId: props.pcListingId, sortBy },
    { enabled: !!props.pcListingId },
  )

  const userQuery = api.users.me.useQuery(undefined, {
    enabled: !!user,
  })

  const verifiedDeveloper = useVerifiedDeveloper(userQuery.data?.id ?? '', props.emulatorId ?? '')

  const utils = api.useUtils()

  const createComment = api.pcListings.createComment.useMutation({
    onSuccess: () => refreshComments(),
  })

  const updateComment = api.pcListings.updateComment.useMutation({
    onSuccess: () => refreshComments(),
  })

  const deleteComment = api.pcListings.deleteComment.useMutation({
    onSuccess: () => refreshComments(),
  })

  const pinCommentMutation = api.pcListings.pinComment.useMutation({
    onSuccess: () => refreshComments(),
  })

  const unpinCommentMutation = api.pcListings.unpinComment.useMutation({
    onSuccess: () => refreshComments(),
  })

  const refreshComments = () => {
    utils.pcListings.getComments.invalidate({ pcListingId: props.pcListingId }).catch(console.error)
  }

  const handlePinComment = async (params: { commentId: string; replaceExisting: boolean }) => {
    await pinCommentMutation.mutateAsync({
      pcListingId: props.pcListingId,
      commentId: params.commentId,
      replaceExisting: params.replaceExisting,
    })
  }

  const handleUnpinComment = async () => {
    await unpinCommentMutation.mutateAsync({ pcListingId: props.pcListingId })
  }

  const canPinComments = Boolean(
    userQuery.data?.role &&
      (hasRolePermission(userQuery.data.role, Role.MODERATOR) ||
        (userQuery.data.role === Role.DEVELOPER &&
          verifiedDeveloper.isVerifiedDeveloper &&
          props.emulatorId)),
  )

  const threadConfig: CommentThreadConfig = {
    entityIdField: 'pcListingId',
    entityType: 'pcListing',
    enableVoting: false,
    sortOptions: [
      { value: 'newest', label: 'Newest first' },
      { value: 'oldest', label: 'Oldest first' },
      { value: 'score', label: 'Top scored' },
    ],
    defaultSort: 'newest',
    avatarStyle: undefined, // PC listings don't use avatars
    replyIndentStyle: 'margin',
  }

  const formConfig: CommentFormConfig = {
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

  const handleDelete = async (commentId: string) => {
    await deleteComment.mutateAsync({ commentId })
  }

  const handleCreateComment = async (data: { content: string; parentId?: string }) => {
    await createComment.mutateAsync({
      pcListingId: props.pcListingId,
      content: data.content,
      parentId: data.parentId,
    })
  }

  const handleUpdateComment = async (data: { commentId: string; content: string }) => {
    await updateComment.mutateAsync({
      commentId: data.commentId,
      content: data.content,
    })
  }

  return (
    <GenericCommentThread
      entityId={props.pcListingId}
      config={threadConfig}
      comments={pcListingsQuery.data?.comments ?? []}
      isLoading={pcListingsQuery.isLoading}
      userRole={userQuery.data?.role}
      entityOwnerId={props.pcListingOwnerId}
      pinnedComment={pcListingsQuery.data?.pinnedComment ?? null}
      canPin={canPinComments}
      onPin={canPinComments ? handlePinComment : undefined}
      onUnpin={canPinComments ? handleUnpinComment : undefined}
      onRefresh={refreshComments}
      onDelete={handleDelete}
      onSortChange={(newSort) => setSortBy(newSort as typeof sortBy)}
      renderForm={({ parentId, editingComment, onSuccess, onCancel }) => (
        <GenericCommentForm
          entityId={props.pcListingId}
          parentId={parentId}
          editingComment={editingComment}
          config={formConfig}
          onSubmit={handleCreateComment}
          onUpdate={handleUpdateComment}
          onSuccess={onSuccess}
          onCancel={onCancel}
          isCreating={createComment.isPending}
          isUpdating={updateComment.isPending}
        />
      )}
    />
  )
}

export default PcCommentThread
