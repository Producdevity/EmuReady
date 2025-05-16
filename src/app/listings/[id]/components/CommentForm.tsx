'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { sanitizeString } from '@/utils/validation'

interface CommentFormProps {
  listingId: string
  onCommentSuccess: () => void
  initialContent?: string
  commentId?: string
  parentId?: string
  onCancelEdit?: () => void
  isEditing?: boolean
  isReply?: boolean
}

export function CommentForm({
  listingId,
  onCommentSuccess,
  initialContent = '',
  commentId,
  parentId,
  onCancelEdit,
  isEditing = false,
  isReply = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const { data: session } = useSession()

  const addComment = api.listings.comment.useMutation({
    onSuccess: () => {
      setContent('')
      onCommentSuccess()
    },
  })

  const editComment = api.listings.editComment.useMutation({
    onSuccess: () => {
      onCommentSuccess()
      if (onCancelEdit) onCancelEdit()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    // Sanitize the content before sending to the server
    const sanitizedContent = sanitizeString(content)
    
    if (sanitizedContent.trim().length === 0) {
      // Don't submit if sanitization removed all content
      return
    }

    if (isEditing && commentId) {
      editComment.mutate({ commentId, content: sanitizedContent })
    } else {
      addComment.mutate({ listingId, content: sanitizedContent, parentId })
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  if (!session) {
    return (
      <div className="mb-2 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          Please <Link href="/login" className="text-blue-600 hover:text-blue-700">sign in</Link> to leave a comment.
        </p>
      </div>
    )
  }

  const formClasses = isReply ? "mb-2" : "mb-6"
  
  const textareaClasses = isReply
    ? "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
    : "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
  
  const rows = isReply ? 2 : 3

  return (
    <form onSubmit={handleSubmit} className={formClasses}>
      <div className="mb-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          className={textareaClasses}
          rows={rows}
          placeholder={isReply ? "Write your reply..." : "Write your comment..."}
          maxLength={1000}
        />
      </div>
      <div className="flex justify-end gap-2">
        {(isEditing || isReply) && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
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
          {isEditing ? 'Save Changes' : isReply ? 'Reply' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
