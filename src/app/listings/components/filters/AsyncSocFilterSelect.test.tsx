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

const OPTION_SOC = {
  id: 'soc-1',
  name: 'Snapdragon 8 Gen 2',
  manufacturer: 'Qualcomm',
} as const
const SELECTED_SOC = {
  id: 'soc-selected',
  name: 'Dimensity 1100',
  manufacturer: 'MediaTek',
} as const
const SOC_LABEL = 'SoCs'
const OPTION_SOC_LABEL = `${OPTION_SOC.manufacturer} ${OPTION_SOC.name}`
const SELECTED_SOC_LABEL = `${SELECTED_SOC.manufacturer} ${SELECTED_SOC.name}`

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
          socs: [OPTION_SOC],
          hasMore: false,
        },
        isFetching: false,
      }))
    },
  )
  apiMocks.socsGetByIdsUseQuery.mockImplementation((input: IdsInput) => ({
    data: input.ids.map((id) => ({
      id,
      name: SELECTED_SOC.name,
      manufacturer: SELECTED_SOC.manufacturer,
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
    render(<AsyncSocFilterSelect label={SOC_LABEL} value={[SELECTED_SOC.id]} onChange={vi.fn()} />)

    expect(screen.getByText(SELECTED_SOC_LABEL)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `${SOC_LABEL} multi-select` }))
    expect(screen.getByText(OPTION_SOC_LABEL)).toBeInTheDocument()
  })
})
