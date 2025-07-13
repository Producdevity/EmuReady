'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { useState, type FormEvent } from 'react'
import { MarkdownEditor } from '@/components/ui/form'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useRecaptchaForComment } from '@/lib/captcha/hooks'
import { cn } from '@/lib/utils'
import { type RouterInput } from '@/types/trpc'
import { validateMarkdown } from '@/utils/markdown'
import { sanitizeString } from '@/utils/validation'

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
  const [content, setContent] = useState(props.initialContent ?? '')
  const { user } = useUser()
  const { executeForComment, isCaptchaEnabled } = useRecaptchaForComment()

  const createComment = api.listings.createComment.useMutation({
    onSuccess: (data) => {
      if (data?.id) {
        analytics.engagement.comment({
          action: props.parentId ? 'reply' : 'created',
          commentId: data.id,
          listingId: props.listingId,
          isReply: !!props.parentId,
          contentLength: content.trim().length,
          gameId: props.gameId,
          systemId: props.systemId,
        })
      }

      setContent('')
      props.onCommentSuccess()
    },
  })

  const editComment = api.listings.editComment.useMutation({
    onSuccess: (_data) => {
      if (props.commentId) {
        analytics.engagement.comment({
          action: 'edited',
          commentId: props.commentId,
          listingId: props.listingId,
          contentLength: content.trim().length,
          gameId: props.gameId,
          systemId: props.systemId,
        })
      }

      props.onCommentSuccess()
      if (props.onCancelEdit) props.onCancelEdit()
    },
  })

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!content.trim()) return

    // Validate and sanitize markdown content (but store the original markdown, not the parsed HTML)
    validateMarkdown(content) // Just validate, don't use the parsed result
    const sanitizedContent = sanitizeString(content)

    if (!sanitizedContent.trim()) return

    // Always use the sanitized original content, not the parsed HTML
    const finalContent = sanitizedContent

    // Get CAPTCHA token for new comments (not for edits)
    let recaptchaToken: string | null = null
    if (!props.isEditing && isCaptchaEnabled) {
      recaptchaToken = await executeForComment()
    }

    if (props.isEditing && props.commentId) {
      editComment.mutate({
        commentId: props.commentId,
        content: finalContent,
      } satisfies RouterInput['listings']['editComment'])
    } else {
      createComment.mutate({
        listingId: props.listingId,
        content: finalContent,
        parentId: props.parentId,
        ...(recaptchaToken && { recaptchaToken }),
      } satisfies RouterInput['listings']['createComment'])
    }
  }

  if (!user) {
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

  const rows = props.isReply ? 2 : 3

  return (
    <form onSubmit={handleSubmit} className={props.isReply ? 'mb-2' : 'mb-6'}>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder={
          props.isReply ? 'Write your reply...' : 'Write your comment...'
        }
        rows={rows}
        maxLength={1000}
        className={cn(props.isReply && 'text-sm')}
      />
      <div className="flex justify-end gap-2 mt-2">
        {(!!props.isEditing || !!props.isReply) && props.onCancelEdit && (
          <button
            type="button"
            onClick={props.onCancelEdit}
            className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim()}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {props.isEditing
            ? 'Save Changes'
            : props.isReply
              ? 'Reply'
              : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}

export default CommentForm
