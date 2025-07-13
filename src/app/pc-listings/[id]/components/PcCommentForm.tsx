'use client'

import { useUser } from '@clerk/nextjs'
import { Send, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { MarkdownEditor } from '@/components/ui/form'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
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
  const { user } = useUser()
  const [content, setContent] = useState(props.editingComment?.content ?? '')

  const createCommentMutation = api.pcListings.createComment.useMutation()
  const updateCommentMutation = api.pcListings.updateComment.useMutation()

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()

    if (!user?.id) return toast.error('Please sign in to comment')

    if (!content.trim()) return toast.error('Please enter a comment')

    try {
      if (props.editingComment) {
        // Update existing comment
        await updateCommentMutation.mutateAsync({
          commentId: props.editingComment.id,
          content: content.trim(),
        })
        toast.success('Comment updated successfully')
      } else {
        // Create new comment
        await createCommentMutation.mutateAsync({
          pcListingId: props.pcListingId,
          content: content.trim(),
          parentId: props.parentId,
        })
        toast.success('Comment posted successfully')
      }

      setContent('')
      props.onSuccess?.()
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to submit comment. Please try again.')
    }
  }

  const handleCancel = () => {
    setContent(props.editingComment?.content ?? '')
    props.onCancel?.()
  }

  if (!user?.id) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        Please sign in to leave a comment
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder={
          props.parentId
            ? 'Write your reply...'
            : 'Share your thoughts about this PC configuration...'
        }
        rows={props.parentId ? 2 : 3}
        maxLength={2000}
        disabled={
          createCommentMutation.isPending || updateCommentMutation.isPending
        }
      />

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          {props.onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={
                createCommentMutation.isPending ||
                updateCommentMutation.isPending
              }
            >
              <X size={16} />
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={
              createCommentMutation.isPending ||
              updateCommentMutation.isPending ||
              !content.trim() ||
              content.length > 2000
            }
            isLoading={
              createCommentMutation.isPending || updateCommentMutation.isPending
            }
            className="flex items-center gap-2"
          >
            <Send size={16} />
            {props.editingComment
              ? 'Update'
              : props.parentId
                ? 'Reply'
                : 'Post Comment'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default PcCommentForm
