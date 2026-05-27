import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import type AsyncSocFilterSelectComponent from './AsyncSocFilterSelect'

const apiMocks = vi.hoisted(() => ({
  useQueries: vi.fn(),
  socsGetByIdsUseQuery: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    useQueries: apiMocks.useQueries,
    socs: {
      getByIds: { useQuery: apiMocks.socsGetByIdsUseQuery },
    },
  },
}))

let AsyncSocFilterSelect: typeof AsyncSocFilterSelectComponent

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
  socs: {
    options: (input: OptionsInput) => OptionsQueryDescriptor
  }
}

function setupApiMocks() {
  apiMocks.useQueries.mockImplementation(
    (queryCallback: (proxy: QueryProxy) => OptionsQueryDescriptor[]) => {
      const descriptors = queryCallback({
        socs: {
          options: (input) => ({ input }),
        },
      })

      return descriptors.map(() => ({
        data: {
          socs: [{ id: 'soc-1', name: 'Snapdragon 8 Gen 2', manufacturer: 'Qualcomm' }],
          hasMore: false,
        },
        isFetching: false,
      }))
    },
  )
  apiMocks.socsGetByIdsUseQuery.mockImplementation((input: IdsInput) => ({
    data: input.ids.map((id) => ({
      id,
      name: 'Dimensity 1100',
      manufacturer: 'MediaTek',
    })),
  }))
}

describe('AsyncSocFilterSelect', () => {
  beforeAll(async () => {
    ;({ default: AsyncSocFilterSelect } = await import('./AsyncSocFilterSelect'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setupApiMocks()
  })

  it('maps SoC option and selected labels', () => {
    render(<AsyncSocFilterSelect label="SoCs" value={['soc-selected']} onChange={vi.fn()} />)

    expect(screen.getByText('MediaTek Dimensity 1100')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'SoCs multi-select' }))
    expect(screen.getByText('Qualcomm Snapdragon 8 Gen 2')).toBeInTheDocument()
  })
})
