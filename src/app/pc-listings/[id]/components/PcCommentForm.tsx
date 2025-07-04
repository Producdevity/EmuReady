'use client'

import { useUser } from '@clerk/nextjs'
import { Send, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createCommentMutation = api.pcListings.createComment.useMutation()
  const updateCommentMutation = api.pcListings.updateComment.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Please enter a comment')
      return
    }

    if (!user?.id) {
      toast.error('Please sign in to comment')
      return
    }

    setIsSubmitting(true)

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
    } finally {
      setIsSubmitting(false)
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
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            props.parentId
              ? 'Write your reply...'
              : 'Share your thoughts about this PC configuration...'
          }
          className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {content.length}/2000 characters
        </div>

        <div className="flex items-center gap-2">
          {props.onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X size={16} />
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !content.trim() || content.length > 2000}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            {isSubmitting
              ? 'Posting...'
              : props.editingComment
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
