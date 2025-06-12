'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { type RouterInput } from '@/types/trpc'
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
}

function CommentForm(props: Props) {
  const [content, setContent] = useState(props.initialContent ?? '')
  const { user } = useUser()

  const createComment = api.listings.createComment.useMutation({
    onSuccess: () => {
      setContent('')
      props.onCommentSuccess()
    },
  })

  const editComment = api.listings.editComment.useMutation({
    onSuccess: () => {
      props.onCommentSuccess()
      if (props.onCancelEdit) props.onCancelEdit()
    },
  })

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!content.trim()) return

    const sanitizedContent = sanitizeString(content)

    if (sanitizedContent.trim().length === 0) return

    if (props.isEditing && props.commentId) {
      editComment.mutate({
        commentId: props.commentId,
        content: sanitizedContent,
      } satisfies RouterInput['listings']['editComment'])
    } else {
      createComment.mutate({
        listingId: props.listingId,
        content: sanitizedContent,
        parentId: props.parentId,
      } satisfies RouterInput['listings']['createComment'])
    }
  }

  if (!user) {
    return (
      <div className="mb-2 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          Please{' '}
          <Link href="/sign-in" className="text-blue-600 hover:text-blue-700">
            sign in
          </Link>{' '}
          to leave a comment.
        </p>
      </div>
    )
  }

  const rows = props.isReply ? 2 : 3

  return (
    <form onSubmit={handleSubmit} className={props.isReply ? 'mb-2' : 'mb-6'}>
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(ev) => setContent(ev.target.value)}
          className={cn(
            'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white',
            props.isReply && 'text-sm',
          )}
          rows={rows}
          placeholder={
            props.isReply ? 'Write your reply...' : 'Write your comment...'
          }
          maxLength={1000}
        />
      </div>
      <div className="flex justify-end gap-2">
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
