import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useListingApi } from './useListingApi'

const mocks = vi.hoisted(() => ({
  handheldVoteMutate: vi.fn(),
  pcVoteMutate: vi.fn(),
  handheldDeleteMutate: vi.fn(),
  pcDeleteMutate: vi.fn(),
  handheldCreateCommentMutate: vi.fn(),
  pcCreateCommentMutate: vi.fn(),
  handheldPinCommentMutate: vi.fn(),
  pcPinCommentMutate: vi.fn(),
  handheldUnpinCommentMutate: vi.fn(),
  pcUnpinCommentMutate: vi.fn(),
}))

vi.mock('@/lib/api', () => {
  const mutationStub = (mutate: (...args: unknown[]) => void) => () => ({
    mutate,
    isPending: false,
  })
  const queryStub = () => ({ data: null, isPending: false })

  return {
    api: {
      listings: {
        vote: { useMutation: mutationStub(mocks.handheldVoteMutate) },
        delete: { useMutation: mutationStub(mocks.handheldDeleteMutate) },
        getSortedComments: { useQuery: queryStub },
        createComment: { useMutation: mutationStub(mocks.handheldCreateCommentMutate) },
        editComment: { useMutation: mutationStub(vi.fn()) },
        deleteComment: { useMutation: mutationStub(vi.fn()) },
        voteComment: { useMutation: mutationStub(vi.fn()) },
        pinComment: { useMutation: mutationStub(mocks.handheldPinCommentMutate) },
        unpinComment: { useMutation: mutationStub(mocks.handheldUnpinCommentMutate) },
      },
      pcListings: {
        vote: { useMutation: mutationStub(mocks.pcVoteMutate) },
        delete: { useMutation: mutationStub(mocks.pcDeleteMutate) },
        getComments: { useQuery: queryStub },
        createComment: { useMutation: mutationStub(mocks.pcCreateCommentMutate) },
        updateComment: { useMutation: mutationStub(vi.fn()) },
        deleteComment: { useMutation: mutationStub(vi.fn()) },
        voteComment: { useMutation: mutationStub(vi.fn()) },
        pinComment: { useMutation: mutationStub(mocks.pcPinCommentMutate) },
        unpinComment: { useMutation: mutationStub(mocks.pcUnpinCommentMutate) },
      },
    },
  }
})

describe('useListingApi', () => {
  describe('handheld mode', () => {
    it('routes vote() to api.listings.vote with listingId/value/recaptchaToken', () => {
      const { result } = renderHook(() => useListingApi('handheld'))

      act(() => {
        result.current.vote({ listingId: 'l1', value: true, recaptchaToken: 'token-123' })
      })

      expect(mocks.handheldVoteMutate).toHaveBeenCalledWith(
        { listingId: 'l1', value: true, recaptchaToken: 'token-123' },
        undefined,
      )
      expect(mocks.pcVoteMutate).not.toHaveBeenCalled()
    })

    it('routes deleteListing() to api.listings.delete with { id }', () => {
      const { result } = renderHook(() => useListingApi('handheld'))

      act(() => {
        result.current.deleteListing('listing-1')
      })

      expect(mocks.handheldDeleteMutate).toHaveBeenCalledWith({ id: 'listing-1' }, undefined)
      expect(mocks.pcDeleteMutate).not.toHaveBeenCalled()
    })

    it('sends parentId as `null` when creating a top-level handheld comment', () => {
      const { result } = renderHook(() => useListingApi('handheld'))

      act(() => {
        result.current.createComment({ listingId: 'l1', content: 'hello' })
      })

      expect(mocks.handheldCreateCommentMutate).toHaveBeenCalledWith(
        {
          listingId: 'l1',
          content: 'hello',
          parentId: null,
          recaptchaToken: null,
        },
        undefined,
      )
    })

    it('maps pinComment input to the handheld schema (listingId + commentId)', () => {
      const { result } = renderHook(() => useListingApi('handheld'))

      act(() => {
        result.current.pinComment({ listingId: 'l1', commentId: 'c1', replaceExisting: true })
      })

      expect(mocks.handheldPinCommentMutate).toHaveBeenCalledWith(
        { listingId: 'l1', commentId: 'c1', replaceExisting: true },
        undefined,
      )
    })
  })

  describe('pc mode', () => {
    it('routes vote() to api.pcListings.vote with pcListingId (not listingId)', () => {
      const { result } = renderHook(() => useListingApi('pc'))

      act(() => {
        result.current.vote({ listingId: 'pc-1', value: false, recaptchaToken: null })
      })

      expect(mocks.pcVoteMutate).toHaveBeenCalledWith(
        { pcListingId: 'pc-1', value: false, recaptchaToken: null },
        undefined,
      )
      expect(mocks.handheldVoteMutate).not.toHaveBeenCalled()
    })

    it('maps listingId → pcListingId and forwards recaptchaToken when creating PC comments', () => {
      const { result } = renderHook(() => useListingApi('pc'))

      act(() => {
        result.current.createComment({
          listingId: 'pc-1',
          content: 'hi',
          parentId: 'parent-1',
          recaptchaToken: 'token-xyz',
        })
      })

      expect(mocks.pcCreateCommentMutate).toHaveBeenCalledWith(
        {
          pcListingId: 'pc-1',
          content: 'hi',
          parentId: 'parent-1',
          recaptchaToken: 'token-xyz',
        },
        undefined,
      )
    })

    it('passes recaptchaToken as null when none is provided (PC createComment)', () => {
      const { result } = renderHook(() => useListingApi('pc'))

      act(() => {
        result.current.createComment({ listingId: 'pc-1', content: 'hi' })
      })

      expect(mocks.pcCreateCommentMutate).toHaveBeenCalledWith(
        expect.objectContaining({ recaptchaToken: null }),
        undefined,
      )
    })

    it('maps pinComment / unpinComment to PC schema shape', () => {
      const { result } = renderHook(() => useListingApi('pc'))

      act(() => {
        result.current.pinComment({ listingId: 'pc-1', commentId: 'c1' })
        result.current.unpinComment({ listingId: 'pc-1' })
      })

      expect(mocks.pcPinCommentMutate).toHaveBeenCalledWith(
        { pcListingId: 'pc-1', commentId: 'c1', replaceExisting: false },
        undefined,
      )
      expect(mocks.pcUnpinCommentMutate).toHaveBeenCalledWith({ pcListingId: 'pc-1' }, undefined)
    })
  })
})
