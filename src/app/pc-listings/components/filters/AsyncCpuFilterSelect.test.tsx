import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type AsyncCpuFilterSelectComponent from './AsyncCpuFilterSelect'

const apiMocks = vi.hoisted(() => ({
  useQueries: vi.fn(),
  cpusGetByIdsUseQuery: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    useQueries: apiMocks.useQueries,
    cpus: {
      getByIds: { useQuery: apiMocks.cpusGetByIdsUseQuery },
    },
  },
}))

let AsyncCpuFilterSelect: typeof AsyncCpuFilterSelectComponent

interface IdsInput {
  ids: string[]
}

interface OptionsInput {
  search?: string
  limit: number
  offset: number
}

interface OptionsQueryDescriptor {
  input: OptionsInput
}

interface QueryProxy {
  cpus: {
    options: (input: OptionsInput) => OptionsQueryDescriptor
  }
}

function setupApiMocks() {
  apiMocks.useQueries.mockImplementation(
    (queryCallback: (proxy: QueryProxy) => OptionsQueryDescriptor[]) => {
      const descriptors = queryCallback({
        cpus: {
          options: (input) => ({ input }),
        },
      })

      return descriptors.map(() => ({
        data: {
          cpus: [
            { id: 'cpu-1', modelName: 'Core i7-12700K', brand: { id: 'intel', name: 'Intel' } },
          ],
          hasMore: false,
        },
        isFetching: false,
      }))
    },
  )
  apiMocks.cpusGetByIdsUseQuery.mockImplementation((input: IdsInput) => ({
    data: input.ids.map((id) => ({
      id,
      modelName: 'Ryzen 7 7800X3D',
      brand: { id: 'amd', name: 'AMD' },
    })),
  }))
}

describe('AsyncCpuFilterSelect', () => {
  beforeAll(async () => {
    ;({ default: AsyncCpuFilterSelect } = await import('./AsyncCpuFilterSelect'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setupApiMocks()
  })

  it('maps CPU option and selected labels', () => {
    render(<AsyncCpuFilterSelect label="CPUs" value={['cpu-selected']} onChange={vi.fn()} />)

    expect(screen.getByText('AMD Ryzen 7 7800X3D')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'CPUs multi-select' }))
    expect(screen.getByText('Intel Core i7-12700K')).toBeInTheDocument()
  })
})
