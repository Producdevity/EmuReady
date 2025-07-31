'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { Send, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
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
  enableRecaptcha?: boolean
  showSignInPrompt?: boolean
  buttonStyle?: 'default' | 'compact'
}

interface GenericCommentFormProps {
  entityId: string
  parentId?: string
  editingComment?: { id: string; content: string }
  config: CommentFormConfig

  // Callbacks
  onSubmit: (data: {
    content: string
    parentId?: string
    recaptchaToken?: string | null
  }) => Promise<void>
  onUpdate?: (data: { commentId: string; content: string }) => Promise<void>
  onSuccess?: () => void
  onCancel?: () => void

  // Optional recaptcha hook
  getRecaptchaToken?: () => Promise<string | null>

  // Loading states
  isCreating?: boolean
  isUpdating?: boolean
}

export function GenericCommentForm(props: GenericCommentFormProps) {
  const { user } = useUser()
  const [content, setContent] = useState(props.editingComment?.content ?? '')

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

    // Validate markdown content
    const validationResult = validateMarkdown(content)
    if (!validationResult.isValid) {
      toast.error(`Invalid content: ${validationResult.errors.join(', ')}`)
      return
    }

    // Use the content directly - markdown parsing will handle sanitization
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      if (props.editingComment && props.onUpdate) {
        // Update existing comment
        await props.onUpdate({
          commentId: props.editingComment.id,
          content: trimmedContent,
        })
        toast.success('Comment updated successfully')
      } else {
        // Get CAPTCHA token if enabled
        let recaptchaToken: string | null = null
        if (props.config.enableRecaptcha && props.getRecaptchaToken) {
          recaptchaToken = await props.getRecaptchaToken()
        }

        // Create new comment
        await props.onSubmit({
          content: trimmedContent,
          parentId: props.parentId,
          recaptchaToken,
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

  // Sign in prompt for unauthenticated users
  if (!user && props.config.showSignInPrompt !== false) {
    return (
      <div className="mb-2 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          Please{' '}
          <SignInButton mode="modal">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 cursor-pointer"
            >
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

            <Button
              type="submit"
              size="sm"
              disabled={
                isLoading || !content.trim() || content.length > maxLength
              }
              isLoading={isLoading}
              className="flex items-center gap-2"
            >
              <Send size={16} />
              {props.editingComment
                ? 'Update'
                : isReply
                  ? 'Reply'
                  : 'Post Comment'}
            </Button>
          </div>
        </div>
      </form>
    )
  }

  // Default style
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
      <div className="flex justify-end gap-2 mt-2">
        {(!!props.editingComment || isReply) && props.onCancel && (
          <Button
            onClick={handleCancel}
            className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!content.trim() || isLoading}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {props.editingComment
            ? 'Save Changes'
            : isReply
              ? 'Reply'
              : 'Post Comment'}
        </Button>
      </div>
    </form>
  )
}
