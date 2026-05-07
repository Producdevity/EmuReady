'use client'

import { api } from '@/lib/api'

export type ListingType = 'handheld' | 'pc'

interface VoteInput {
  listingId: string
  value: boolean
  recaptchaToken?: string | null
}

interface CommentIdInput {
  commentId: string
}

interface CommentVoteInput extends CommentIdInput {
  value: boolean
}

interface CreateCommentInput {
  listingId: string
  content: string
  parentId?: string
  recaptchaToken?: string | null
}

interface UpdateCommentInput extends CommentIdInput {
  content: string
}

interface PinCommentInput {
  listingId: string
  commentId: string
  replaceExisting?: boolean
}

interface UnpinCommentInput {
  listingId: string
}

interface GetCommentsInput {
  listingId: string
  sortBy?: 'newest' | 'oldest' | 'score' | 'popular'
  limit?: number
  offset?: number
}

type MutationOptions<TData> = {
  onSuccess?: (data: TData) => void
  onError?: (error: unknown) => void
}

type HandheldSortBy = 'newest' | 'oldest' | 'popular'
type PcSortBy = 'newest' | 'oldest' | 'score'

function toHandheldSortBy(value: GetCommentsInput['sortBy']): HandheldSortBy {
  if (value === 'score') return 'popular'
  if (value === undefined) return 'newest'
  return value
}

function toPcSortBy(value: GetCommentsInput['sortBy']): PcSortBy {
  if (value === 'popular') return 'score'
  if (value === undefined) return 'newest'
  return value
}

// Both handheld and PC mutations are always instantiated: React requires
// stable hook order, and tRPC's useMutation/useQuery only fire on .mutate/
// query enablement, so the inactive branch has no runtime cost.
export function useListingApi(listingType: ListingType) {
  const isPc = listingType === 'pc'

  const handheldVoteMutation = api.listings.vote.useMutation()
  const pcVoteMutation = api.pcListings.vote.useMutation()

  const vote = (input: VoteInput, options?: MutationOptions<unknown>) => {
    if (isPc) {
      return pcVoteMutation.mutate(
        {
          pcListingId: input.listingId,
          value: input.value,
          recaptchaToken: input.recaptchaToken ?? null,
        },
        options,
      )
    }
    return handheldVoteMutation.mutate(
      {
        listingId: input.listingId,
        value: input.value,
        recaptchaToken: input.recaptchaToken ?? null,
      },
      options,
    )
  }

  const isVotePending = isPc ? pcVoteMutation.isPending : handheldVoteMutation.isPending

  const handheldDeleteMutation = api.listings.delete.useMutation()
  const pcDeleteMutation = api.pcListings.delete.useMutation()

  const deleteListing = (id: string, options?: MutationOptions<unknown>) =>
    isPc ? pcDeleteMutation.mutate({ id }, options) : handheldDeleteMutation.mutate({ id }, options)

  const isDeletePending = isPc ? pcDeleteMutation.isPending : handheldDeleteMutation.isPending

  const useCommentsQuery = (
    input: GetCommentsInput,
    queryOptions?: { enabled?: boolean; refetchOnWindowFocus?: boolean },
  ) => {
    const handheldQuery = api.listings.getSortedComments.useQuery(
      { listingId: input.listingId, sortBy: toHandheldSortBy(input.sortBy) },
      { enabled: !isPc && (queryOptions?.enabled ?? true), ...queryOptions },
    )
    const pcQuery = api.pcListings.getComments.useQuery(
      {
        pcListingId: input.listingId,
        sortBy: toPcSortBy(input.sortBy),
        limit: input.limit,
        offset: input.offset,
      },
      { enabled: isPc && (queryOptions?.enabled ?? true), ...queryOptions },
    )
    return isPc ? pcQuery : handheldQuery
  }

  const handheldCreateCommentMutation = api.listings.createComment.useMutation()
  const pcCreateCommentMutation = api.pcListings.createComment.useMutation()

  const createComment = (input: CreateCommentInput, options?: MutationOptions<unknown>) => {
    if (isPc) {
      return pcCreateCommentMutation.mutate(
        {
          pcListingId: input.listingId,
          content: input.content,
          parentId: input.parentId,
          recaptchaToken: input.recaptchaToken ?? null,
        },
        options,
      )
    }
    return handheldCreateCommentMutation.mutate(
      {
        listingId: input.listingId,
        content: input.content,
        parentId: input.parentId ?? null,
        recaptchaToken: input.recaptchaToken ?? null,
      },
      options,
    )
  }

  const isCreateCommentPending = isPc
    ? pcCreateCommentMutation.isPending
    : handheldCreateCommentMutation.isPending

  const handheldUpdateCommentMutation = api.listings.editComment.useMutation()
  const pcUpdateCommentMutation = api.pcListings.updateComment.useMutation()

  const updateComment = (input: UpdateCommentInput, options?: MutationOptions<unknown>) => {
    const payload = { commentId: input.commentId, content: input.content }
    return isPc
      ? pcUpdateCommentMutation.mutate(payload, options)
      : handheldUpdateCommentMutation.mutate(payload, options)
  }

  const isUpdateCommentPending = isPc
    ? pcUpdateCommentMutation.isPending
    : handheldUpdateCommentMutation.isPending

  const handheldDeleteCommentMutation = api.listings.deleteComment.useMutation()
  const pcDeleteCommentMutation = api.pcListings.deleteComment.useMutation()

  const deleteComment = (input: CommentIdInput, options?: MutationOptions<unknown>) => {
    const payload = { commentId: input.commentId }
    return isPc
      ? pcDeleteCommentMutation.mutate(payload, options)
      : handheldDeleteCommentMutation.mutate(payload, options)
  }

  const handheldVoteCommentMutation = api.listings.voteComment.useMutation()
  const pcVoteCommentMutation = api.pcListings.voteComment.useMutation()

  const voteComment = (input: CommentVoteInput, options?: MutationOptions<unknown>) => {
    const payload = { commentId: input.commentId, value: input.value }
    return isPc
      ? pcVoteCommentMutation.mutate(payload, options)
      : handheldVoteCommentMutation.mutate(payload, options)
  }

  const handheldPinCommentMutation = api.listings.pinComment.useMutation()
  const pcPinCommentMutation = api.pcListings.pinComment.useMutation()

  const pinComment = (input: PinCommentInput, options?: MutationOptions<unknown>) => {
    if (isPc) {
      return pcPinCommentMutation.mutate(
        {
          pcListingId: input.listingId,
          commentId: input.commentId,
          replaceExisting: input.replaceExisting ?? false,
        },
        options,
      )
    }
    return handheldPinCommentMutation.mutate(
      {
        listingId: input.listingId,
        commentId: input.commentId,
        replaceExisting: input.replaceExisting ?? false,
      },
      options,
    )
  }

  const handheldUnpinCommentMutation = api.listings.unpinComment.useMutation()
  const pcUnpinCommentMutation = api.pcListings.unpinComment.useMutation()

  const unpinComment = (input: UnpinCommentInput, options?: MutationOptions<unknown>) => {
    if (isPc) {
      return pcUnpinCommentMutation.mutate({ pcListingId: input.listingId }, options)
    }
    return handheldUnpinCommentMutation.mutate({ listingId: input.listingId }, options)
  }

  return {
    listingType,
    vote,
    isVotePending,
    deleteListing,
    isDeletePending,
    useCommentsQuery,
    createComment,
    isCreateCommentPending,
    updateComment,
    isUpdateCommentPending,
    deleteComment,
    voteComment,
    pinComment,
    unpinComment,
  }
}
