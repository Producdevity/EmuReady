'use client'

import {
  GenericCommentForm,
  type CommentFormConfig,
} from '@/components/comments'
import { api } from '@/lib/api'
import { type RouterOutput } from '@/types/trpc'

type AnyComment = RouterOutput['pcListings']['getComments']['comments'][number]

interface Props {
  pcListingId: string
  parentId?: string
  editingComment?: AnyComment | { id: string; content: string }
  onSuccess?: () => void
  onCancel?: () => void
}

function PcCommentForm(props: Props) {
  const createComment = api.pcListings.createComment.useMutation()
  const updateComment = api.pcListings.updateComment.useMutation()

  const config: CommentFormConfig = {
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

  const handleSubmit = async (data: { content: string; parentId?: string }) => {
    await createComment.mutateAsync({
      pcListingId: props.pcListingId,
      content: data.content,
      parentId: data.parentId,
    })
  }

  const handleUpdate = async (data: { commentId: string; content: string }) => {
    await updateComment.mutateAsync({
      commentId: data.commentId,
      content: data.content,
    })
  }

  return (
    <GenericCommentForm
      entityId={props.pcListingId}
      parentId={props.parentId}
      editingComment={
        props.editingComment
          ? {
              id: props.editingComment.id,
              content: props.editingComment.content,
            }
          : undefined
      }
      config={config}
      onSubmit={handleSubmit}
      onUpdate={handleUpdate}
      onSuccess={props.onSuccess}
      onCancel={props.onCancel}
      isCreating={createComment.isPending}
      isUpdating={updateComment.isPending}
    />
  )
}

export default PcCommentForm
