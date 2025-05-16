'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import Link from 'next/link'

interface CommentFormProps {
  listingId: string
  onCommentSuccess: () => void
  initialContent?: string
  commentId?: string
  onCancelEdit?: () => void
  isEditing?: boolean
}

export function CommentForm({
  listingId,
  onCommentSuccess,
  initialContent = '',
  commentId,
  onCancelEdit,
  isEditing = false,
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

    if (isEditing && commentId) {
      editComment.mutate({ commentId, content })
    } else {
      addComment.mutate({ listingId, content })
    }
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

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          rows={3}
          placeholder="Write your comment..."
        />
      </div>
      <div className="flex justify-end gap-2">
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditing ? 'Save Changes' : 'Post Comment'}
        </button>
      </div>
    </form>
  )
}
