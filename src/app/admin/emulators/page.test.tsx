import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm'
import AdminEmulatorsPage from './page'
import type * as UI from '@/components/ui'

const mocks = vi.hoisted(() => {
  const permissions: string[] = []
  return { permissions, statsQuery: vi.fn() }
})

vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({}),
    users: {
      me: {
        useQuery: () => ({
          data: { id: 'admin', role: Role.ADMIN, permissions: mocks.permissions },
        }),
      },
    },
    emulators: {
      stats: { useQuery: mocks.statsQuery },
      getForAdmin: { useQuery: () => ({ data: { emulators: [] }, isPending: false }) },
      delete: { useMutation: () => ({ isPending: false }) },
    },
  },
}))
vi.mock('@/hooks', () => ({
  useColumnVisibility: () => ({}),
  useEmulatorLogos: () => ({ isHydrated: true, showEmulatorLogos: false }),
}))
vi.mock('@/hooks/admin', () => ({
  useAdminTable: () => ({ search: '', page: 1, limit: 20, sortField: null, sortDirection: null }),
}))
vi.mock('@/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UI>()),
  ColumnVisibilityControl: () => null,
  DisplayToggleButton: () => null,
  useConfirmDialog: () => vi.fn(),
}))
vi.mock('@/app/admin/emulators/components/EmulatorModal', () => ({ default: () => null }))

describe('emulator statistics visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.permissions = [PERMISSIONS.VIEW_STATISTICS]
    mocks.statsQuery.mockReturnValue({
      data: { total: 99, withListings: 41, withSystems: 17 },
      isPending: false,
    })
  })

  it('hides cached statistics when the user loses permission', () => {
    const view = render(<AdminEmulatorsPage />)
    expect(screen.getByText('Total Emulators')).toBeVisible()

    mocks.permissions = []
    view.rerender(<AdminEmulatorsPage />)

    expect(screen.queryByText('Total Emulators')).not.toBeInTheDocument()
    expect(mocks.statsQuery).toHaveBeenLastCalledWith(undefined, { enabled: false })
  })
})
