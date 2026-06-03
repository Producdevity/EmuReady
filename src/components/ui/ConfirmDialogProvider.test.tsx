import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialogProvider, useConfirmDialog } from './ConfirmDialogProvider'

function ConfirmDialogHarness(props: { onConfirm: (confirmed: boolean) => void }) {
  const confirm = useConfirmDialog()

  const handleOpen = async () => {
    const confirmed = await confirm({
      title: 'Reject review-risk reports?',
      description: 'This action will reject matching reports.',
      details: [
        { label: 'Will reject', value: '3 handheld reports', tone: 'danger' },
        { label: 'Rule', value: 'High author risk, or high submission risk + author risk signal' },
      ],
      confirmText: 'Reject 3 Reports',
      confirmVariant: 'danger',
    })

    props.onConfirm(confirmed)
  }

  return <button onClick={() => void handleOpen()}>Open confirm</button>
}

describe('ConfirmDialogProvider', () => {
  it('renders detail rows and destructive confirm styling', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmDialogProvider>
        <ConfirmDialogHarness onConfirm={onConfirm} />
      </ConfirmDialogProvider>,
    )

    await user.click(screen.getByRole('button', { name: /open confirm/i }))

    expect(screen.getByText('Will reject')).toBeInTheDocument()
    expect(screen.getByText('3 handheld reports')).toBeInTheDocument()
    expect(screen.getByText('Rule')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: /reject 3 reports/i })
    expect(confirmButton).toHaveClass('bg-red-600')

    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledWith(true)
  })

  it('resolves false when the dialog is dismissed', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmDialogProvider>
        <ConfirmDialogHarness onConfirm={onConfirm} />
      </ConfirmDialogProvider>,
    )

    await user.click(screen.getByRole('button', { name: /open confirm/i }))
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(false)
    })
  })
})
