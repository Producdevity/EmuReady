'use client'

import { GenericCommentForm, type CommentFormConfig } from '@/components/comments'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { type RouterInput } from '@/types/trpc'

interface Props {
  listingId: string
  onCommentSuccess: () => void
  initialContent?: string
  commentId?: string
  parentId?: string
  onCancelEdit?: () => void
  isEditing?: boolean
  isReply?: boolean
  gameId?: string
  systemId?: string
}

function CommentForm(props: Props) {
  const createComment = api.listings.createComment.useMutation({
    onSuccess: (data) => {
      if (data?.id) {
        analytics.engagement.comment({
          action: props.parentId ? 'reply' : 'created',
          commentId: data.id,
          listingId: props.listingId,
          isReply: !!props.parentId,
          contentLength: 0, // Set in handleSubmit
          gameId: props.gameId,
          systemId: props.systemId,
        })
      }
      props.onCommentSuccess()
    },
  })

  const editComment = api.listings.editComment.useMutation({
    onSuccess: () => {
      if (props.commentId) {
        analytics.engagement.comment({
          action: 'edited',
          commentId: props.commentId,
          listingId: props.listingId,
          contentLength: 0, // Set in handleUpdate
          gameId: props.gameId,
          systemId: props.systemId,
        })
      }
      props.onCommentSuccess()
      if (props.onCancelEdit) props.onCancelEdit()
    },
  })

  const config: CommentFormConfig = {
    entityType: 'listing',
    placeholders: {
      comment: 'Write your comment...',
      reply: 'Write your reply...',
    },
    maxLength: 1000,
    showSignInPrompt: true,
    buttonStyle: 'default',
  }

  const handleSubmit = async (data: {
    content: string
    parentId?: string
    humanVerificationToken?: string
  }) => {
    await createComment.mutateAsync({
      listingId: props.listingId,
      content: data.content,
      parentId: data.parentId,
      humanVerificationToken: data.humanVerificationToken,
    } satisfies RouterInput['listings']['createComment'])
  }

  const handleUpdate = async (data: { commentId: string; content: string }) => {
    await editComment.mutateAsync({
      commentId: data.commentId,
      content: data.content,
    } satisfies RouterInput['listings']['editComment'])
  }

  return (
    <GenericCommentForm
      entityId={props.listingId}
      parentId={props.parentId}
      editingComment={
        props.commentId
          ? {
              id: props.commentId,
              content: props.initialContent ?? '',
            }
          : undefined
      }
      config={config}
      onSubmit={handleSubmit}
      onUpdate={handleUpdate}
      onSuccess={props.onCommentSuccess}
      onCancel={props.onCancelEdit}
      isCreating={createComment.isPending}
      isUpdating={editComment.isPending}
    />
  )
}

export default CommentForm
