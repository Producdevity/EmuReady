'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { Send, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { useSubmitWithHumanVerification } from '@/features/human-verification/client'
import { MarkdownEditor } from '@/lib/dynamic-imports'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { validateMarkdown } from '@/utils/markdown'

export interface CommentFormConfig {
  entityType: 'listing' | 'pcListing'
  placeholders?: {
    comment?: string
    reply?: string
  }
  maxLength?: number
  showSignInPrompt?: boolean
  buttonStyle?: 'default' | 'compact'
}

interface GenericCommentFormProps {
  entityId: string
  parentId?: string
  editingComment?: { id: string; content: string }
  config: CommentFormConfig

  onSubmit: (data: {
    content: string
    parentId?: string
    humanVerificationToken?: string
  }) => Promise<void>
  onUpdate?: (data: { commentId: string; content: string }) => Promise<void>
  onSuccess?: () => void
  onCancel?: () => void

  isCreating?: boolean
  isUpdating?: boolean
}

export function GenericCommentForm(props: GenericCommentFormProps) {
  const { user } = useUser()
  const [content, setContent] = useState(props.editingComment?.content ?? '')
  const submitWithHumanVerification = useSubmitWithHumanVerification()

  const isLoading = props.isCreating || props.isUpdating
  const maxLength = props.config.maxLength ?? 2000

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()

    if (!user?.id) {
      toast.error('Please sign in to comment')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter a comment')
      return
    }

    const validationResult = validateMarkdown(content)
    if (!validationResult.isValid) {
      toast.error(`Invalid content: ${validationResult.errors[0]}`)
      return
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      if (props.editingComment && props.onUpdate) {
        await props.onUpdate({
          commentId: props.editingComment.id,
          content: trimmedContent,
        })
        toast.success('Comment updated successfully')
      } else {
        await submitWithHumanVerification((humanVerificationToken) => {
          return props.onSubmit({
            content: trimmedContent,
            parentId: props.parentId,
            humanVerificationToken,
          })
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

  if (!user && props.config.showSignInPrompt !== false) {
    return (
      <div className="mb-2 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          Please{' '}
          <SignInButton mode="modal">
            <button type="button" className="text-blue-600 hover:text-blue-700 cursor-pointer">
              sign in
            </button>
          </SignInButton>{' '}
          to leave a comment.
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        Please sign in to leave a comment
      </div>
    )
  }

  const isReply = !!props.parentId
  const rows = isReply ? 2 : 3

  const placeholder = isReply
    ? (props.config.placeholders?.reply ?? 'Write your reply...')
    : (props.config.placeholders?.comment ?? 'Share your thoughts...')

  if (props.config.buttonStyle === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={isLoading}
          className={cn(isReply && 'text-sm')}
        />

        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            {props.onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X size={16} />
                Cancel
              </Button>
            )}

            {/*TODO: allow Cmd+Enter or Ctrl+Enter to submit*/}
            <Button
              type="submit"
              size="sm"
              icon={Send}
              disabled={isLoading || !content.trim() || content.length > maxLength}
              isLoading={isLoading}
            >
              {props.editingComment ? 'Update' : isReply ? 'Reply' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={isReply ? 'mb-2' : 'mb-6'}>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={cn(isReply && 'text-sm')}
      />
      <div className="flex justify-end gap-2 mt-2 mb-8">
        {(!!props.editingComment || isReply) && props.onCancel && (
          <Button type="button" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        )}
        {/*TODO: allow Cmd+Enter or Ctrl+Enter to submit*/}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isLoading}
          disabled={!content.trim() || isLoading}
        >
          {props.editingComment ? 'Save Changes' : isReply ? 'Reply' : 'Post Comment'}
        </Button>
      </div>
    </form>
  )
}
