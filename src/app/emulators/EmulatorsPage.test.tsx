import { render, screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { type RouterOutput } from '@/types/trpc'
import EmulatorsPage from './EmulatorsPage'
import type EmulatorViewModal from './components/EmulatorViewModal'
import type * as UI from '@/components/ui'

type Emulator = RouterOutput['emulators']['get']['emulators'][number]
const selected: Emulator = {
  id: 'emulator-1',
  name: 'Selected emulator',
  logo: null,
  description: null,
  repositoryUrl: null,
  officialUrl: null,
  androidGithubRepoUrl: null,
  systems: [],
  verifiedDevelopers: [],
  _count: { systems: 0, listings: 1 },
}
let emulators: Emulator[] = []
let params = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => params,
}))
vi.mock('@/hooks', () => ({ useColumnVisibility: () => ({ isColumnVisible: () => false }) }))
vi.mock('@/lib/api', () => ({
  api: {
    emulators: {
      get: { useQuery: () => ({ data: { emulators }, isPending: false }) },
      byId: { useQuery: () => ({ data: undefined, isFetching: true }) },
    },
  },
}))
vi.mock('@/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UI>()),
  ColumnVisibilityControl: () => null,
}))
vi.mock('./components/EmulatorViewModal', () => ({
  default: (props: ComponentProps<typeof EmulatorViewModal>) =>
    props.isOpen && props.emulatorData ? <div role="dialog">{props.emulatorData.name}</div> : null,
}))
beforeEach(() => {
  emulators = [selected]
  params = new URLSearchParams('emulatorId=emulator-1')
})

it('keeps the selected details visible while the emulator leaves the current results', () => {
  const view = render(<EmulatorsPage />)
  expect(screen.getByRole('dialog')).toHaveTextContent('Selected emulator')
  emulators = []
  view.rerender(<EmulatorsPage />)
  expect(screen.getByRole('dialog')).toHaveTextContent('Selected emulator')
  params = new URLSearchParams('emulatorId=another-emulator')
  view.rerender(<EmulatorsPage />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
