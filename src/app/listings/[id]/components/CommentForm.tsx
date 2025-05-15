'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CommentFormProps {
  listingId: string
  onCommentSuccess?: () => void
}

export function CommentForm({ listingId, onCommentSuccess }: CommentFormProps) {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const [comment, setComment] = useState('')
  
  const commentMutation = api.listings.comment.useMutation({
    onSuccess: () => {
      setComment('') // Clear the form
      if (onCommentSuccess) {
        onCommentSuccess()
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated || !comment.trim()) {
      return
    }
    
    commentMutation.mutate({
      listingId,
      content: comment,
    })
  }
  
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Please sign in to leave a comment
        </p>
        <Link
          href="/login"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Sign in
        </Link>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-2">
        <textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 text-gray-700 dark:text-gray-200 border rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                    bg-white dark:bg-gray-800 dark:border-gray-700"
          rows={3}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={commentMutation.isPending}
          disabled={commentMutation.isPending || !comment.trim()}
        >
          Post Comment
        </Button>
      </div>
    </form>
  )
} 