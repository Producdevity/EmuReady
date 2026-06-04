import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GenericCommentForm } from './GenericCommentForm'
import type { ReactNode } from 'react'

const testMocks = vi.hoisted(() => ({
  useUser: vi.fn(() => ({ user: { id: 'user-1' } })),
  submitWithHumanVerification: vi.fn(
    async (callback: (humanVerificationToken: string) => Promise<void>) => {
      await callback('verification-token')
    },
  ),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: testMocks.useUser,
  SignInButton: (props: { children: ReactNode }) => props.children,
}))

vi.mock('@/features/human-verification/client', () => ({
  useSubmitWithHumanVerification: () => testMocks.submitWithHumanVerification,
}))

vi.mock('@/lib/toast', () => ({
  default: {
    error: testMocks.toastError,
    success: testMocks.toastSuccess,
  },
}))

vi.mock('@/lib/dynamic-imports', async () => {
  const actual = await vi.importActual<{ MarkdownEditor: unknown }>(
    '@/components/ui/form/MarkdownEditor',
  )

  return { MarkdownEditor: actual.MarkdownEditor }
})

describe('GenericCommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['Cmd+Enter', { metaKey: true }],
    ['Ctrl+Enter', { ctrlKey: true }],
  ])('submits comments with %s', async (_shortcut, keyModifiers) => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <GenericCommentForm
        entityId="listing-1"
        config={{ entityType: 'listing' }}
        onSubmit={onSubmit}
      />,
    )

    const editor = screen.getByRole('textbox')
    await user.type(editor, 'Runs well')

    fireEvent.keyDown(editor, { key: 'Enter', ...keyModifiers })

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Runs well',
          humanVerificationToken: 'verification-token',
        }),
      )
    })
  })

  it('does not submit when Enter is pressed without a modifier key', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <GenericCommentForm
        entityId="listing-1"
        config={{ entityType: 'listing' }}
        onSubmit={onSubmit}
      />,
    )

    const editor = screen.getByRole('textbox')
    await user.type(editor, 'Runs well')

    fireEvent.keyDown(editor, { key: 'Enter' })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
