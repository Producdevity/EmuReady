import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type AsyncGpuFilterSelectComponent from './AsyncGpuFilterSelect'

const apiMocks = vi.hoisted(() => ({
  useQueries: vi.fn(),
  gpusGetByIdsUseQuery: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    useQueries: apiMocks.useQueries,
    gpus: {
      getByIds: { useQuery: apiMocks.gpusGetByIdsUseQuery },
    },
  },
}))

let AsyncGpuFilterSelect: typeof AsyncGpuFilterSelectComponent

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
  gpus: {
    options: (input: OptionsInput) => OptionsQueryDescriptor
  }
}

function setupApiMocks() {
  apiMocks.useQueries.mockImplementation(
    (queryCallback: (proxy: QueryProxy) => OptionsQueryDescriptor[]) => {
      const descriptors = queryCallback({
        gpus: {
          options: (input) => ({ input }),
        },
      })

      return descriptors.map(() => ({
        data: {
          gpus: [
            { id: 'gpu-1', modelName: 'GeForce RTX 4070', brand: { id: 'nvidia', name: 'NVIDIA' } },
          ],
          hasMore: false,
        },
        isFetching: false,
      }))
    },
  )
  apiMocks.gpusGetByIdsUseQuery.mockImplementation((input: IdsInput) => ({
    data: input.ids.map((id) => ({
      id,
      modelName: 'Radeon RX 7800 XT',
      brand: { id: 'amd', name: 'AMD' },
    })),
  }))
}

describe('AsyncGpuFilterSelect', () => {
  beforeAll(async () => {
    ;({ default: AsyncGpuFilterSelect } = await import('./AsyncGpuFilterSelect'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setupApiMocks()
  })

  it('maps GPU summaries to dropdown and selected labels', () => {
    render(<AsyncGpuFilterSelect label="GPUs" value={['gpu-selected']} onChange={vi.fn()} />)

    expect(screen.getByText('AMD Radeon RX 7800 XT')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'GPUs multi-select' }))
    expect(screen.getByText('NVIDIA GeForce RTX 4070')).toBeInTheDocument()
  })
})
