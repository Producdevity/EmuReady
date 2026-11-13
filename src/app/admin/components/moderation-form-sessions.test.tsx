import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role, type User } from '@orm'
import { AdminQuotaDialog } from '../api-access/components/AdminQuotaDialog'
import CreateBanModal from '../user-bans/components/CreateBanModal'
import EditVerifiedDeveloperModal from '../verified-developers/components/EditVerifiedDeveloperModal'

const mocks = vi.hoisted(
  (): {
    preselectedUser: Pick<User, 'id' | 'name' | 'role' | 'profileImage' | 'trustScore'> | undefined
    createBan: ReturnType<typeof vi.fn>
  } => ({ preselectedUser: undefined, createBan: vi.fn() }),
)
vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: { id: 'clerk-1' } }) }))
vi.mock('@/lib/toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/lib/api', () => ({
  api: {
    users: {
      me: {
        useQuery: () => ({
          isSuccess: true,
          data: { role: Role.SUPER_ADMIN, permissions: [PERMISSIONS.MANAGE_USER_BANS] },
        }),
      },
      searchUsers: { useQuery: () => ({ data: [], isFetching: false }) },
      getUserById: { useQuery: () => ({ data: mocks.preselectedUser }) },
    },
    userBans: { create: { useMutation: () => ({ mutate: mocks.createBan, isPending: false }) } },
    emulators: {
      get: {
        useQuery: () => ({ data: { emulators: [{ id: 'emulator-1', name: 'Emulator One' }] } }),
      },
    },
    verifiedDevelopers: {
      updateVerifiedDeveloper: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
  },
}))

beforeEach(() => {
  mocks.preselectedUser = undefined
  vi.clearAllMocks()
})

describe('quota form sessions', () => {
  it('keeps an unchanged expiry at the same instant in a non-UTC timezone', async () => {
    const previous = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const onClose = vi.fn()
      render(
        <AdminQuotaDialog
          keyId="expiring"
          keys={[
            {
              id: 'expiring',
              name: 'Expiry',
              expiresAt: new Date('2027-01-15T15:30:00Z'),
              monthlyQuota: 100,
              weeklyQuota: 20,
              burstQuota: 5,
            },
          ]}
          isSubmitting={false}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ expiresAt: '2027-01-15T15:30:00.000Z' }),
        ),
      )
    } finally {
      if (previous === undefined) delete process.env.TZ
      else process.env.TZ = previous
    }
  })

  const key = {
    id: 'key-1',
    name: 'First key',
    monthlyQuota: 100,
    weeklyQuota: 20,
    burstQuota: 5,
    expiresAt: null,
  }
  const callbacks = { onClose: vi.fn(), onSubmit: vi.fn(), isSubmitting: false }

  it('keeps a draft during a refetch and resets it after closing', () => {
    const view = render(<AdminQuotaDialog {...callbacks} keyId={key.id} keys={[key]} />)
    fireEvent.change(screen.getByDisplayValue('100'), { target: { value: '333' } })
    const refreshed = { ...key, monthlyQuota: 200 }
    view.rerender(<AdminQuotaDialog {...callbacks} keyId={key.id} keys={[refreshed]} />)
    expect(screen.getByDisplayValue('333')).toBeInTheDocument()
    view.rerender(<AdminQuotaDialog {...callbacks} keyId="" keys={[refreshed]} />)
    view.rerender(<AdminQuotaDialog {...callbacks} keyId={key.id} keys={[refreshed]} />)
    expect(screen.getByDisplayValue('200')).toBeInTheDocument()
  })

  it('starts with the selected key’s quotas when switching records', () => {
    const second = { ...key, id: 'key-2', monthlyQuota: 400 }
    const view = render(<AdminQuotaDialog {...callbacks} keyId={key.id} keys={[key, second]} />)
    fireEvent.change(screen.getByDisplayValue('100'), { target: { value: '333' } })
    view.rerender(<AdminQuotaDialog {...callbacks} keyId={second.id} keys={[key, second]} />)
    expect(screen.getByDisplayValue('400')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('333')).not.toBeInTheDocument()
  })
})

describe('verified developer sessions', () => {
  const record = {
    id: 'verification-1',
    emulatorId: 'emulator-1',
    notes: 'Original notes',
    user: { name: 'Developer', email: 'developer@example.com' },
  }
  const callbacks = { onClose: vi.fn(), onSuccess: vi.fn() }

  it('keeps edited notes across a refetch and resets them on reopening', () => {
    const view = render(
      <EditVerifiedDeveloperModal {...callbacks} isOpen verifiedDeveloper={record} />,
    )
    fireEvent.change(screen.getByLabelText('Notes (Optional)'), {
      target: { value: 'Unsaved draft' },
    })
    view.rerender(
      <EditVerifiedDeveloperModal {...callbacks} isOpen verifiedDeveloper={{ ...record }} />,
    )
    expect(screen.getByLabelText('Notes (Optional)')).toHaveValue('Unsaved draft')
    view.rerender(
      <EditVerifiedDeveloperModal {...callbacks} isOpen={false} verifiedDeveloper={record} />,
    )
    view.rerender(<EditVerifiedDeveloperModal {...callbacks} isOpen verifiedDeveloper={record} />)
    expect(screen.getByLabelText('Notes (Optional)')).toHaveValue('Original notes')
  })

  it('clears a draft when selecting a different verification', () => {
    const view = render(
      <EditVerifiedDeveloperModal {...callbacks} isOpen verifiedDeveloper={record} />,
    )
    fireEvent.change(screen.getByLabelText('Notes (Optional)'), {
      target: { value: 'Unsaved draft' },
    })
    view.rerender(
      <EditVerifiedDeveloperModal
        {...callbacks}
        isOpen
        verifiedDeveloper={{ ...record, id: 'verification-2', notes: 'Second record' }}
      />,
    )
    expect(screen.getByLabelText('Notes (Optional)')).toHaveValue('Second record')
  })
})

describe('preselected ban targets', () => {
  it('does not select an unnamed preselected user', () => {
    mocks.preselectedUser = {
      id: 'user-1',
      name: null,
      role: Role.USER,
      profileImage: null,
      trustScore: 10,
    }
    render(<CreateBanModal isOpen userId="user-1" onClose={vi.fn()} onSuccess={vi.fn()} />)
    fireEvent.change(
      screen.getByPlaceholderText('Provide a clear reason for banning this user...'),
      { target: { value: 'Spam' } },
    )
    expect(screen.getByRole('button', { name: 'Ban User Permanently' })).toBeDisabled()
  })

  const callbacks = { onClose: vi.fn(), onSuccess: vi.fn() }

  it('shows an asynchronously loaded target without copying it into form state', () => {
    const view = render(<CreateBanModal {...callbacks} isOpen userId="user-1" />)
    expect(screen.getByPlaceholderText('Search users by name or email...')).toHaveValue('')
    mocks.preselectedUser = {
      id: 'user-1',
      name: 'Target User',
      role: Role.USER,
      profileImage: null,
      trustScore: 10,
    }
    view.rerender(<CreateBanModal {...callbacks} isOpen userId="user-1" />)
    expect(screen.getByPlaceholderText('Search users by name or email...')).toHaveValue(
      'Target User',
    )
  })

  it('does not retain the previous user while a different target is loading', () => {
    mocks.preselectedUser = {
      id: 'user-1',
      name: 'First User',
      role: Role.USER,
      profileImage: null,
      trustScore: 10,
    }
    const view = render(<CreateBanModal {...callbacks} isOpen userId="user-1" />)
    view.rerender(<CreateBanModal {...callbacks} isOpen userId="user-2" />)
    expect(screen.getByPlaceholderText('Search users by name or email...')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Ban User Permanently' })).toBeDisabled()
  })
})
