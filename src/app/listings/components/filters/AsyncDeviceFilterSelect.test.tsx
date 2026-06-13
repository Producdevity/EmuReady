import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { LOOKUP_PAGINATION } from '@/data/constants'
import type AsyncDeviceFilterSelectComponent from './AsyncDeviceFilterSelect'

const apiMocks = vi.hoisted(() => ({
  useQueries: vi.fn(),
  devicesGetByIdsUseQuery: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  api: {
    useQueries: apiMocks.useQueries,
    devices: {
      getByIds: { useQuery: apiMocks.devicesGetByIdsUseQuery },
    },
  },
}))

let AsyncDeviceFilterSelect: typeof AsyncDeviceFilterSelectComponent

interface OptionsInput {
  search?: string
  limit: number
  offset: number
}

interface IdsInput {
  ids: string[]
}

interface OptionsQueryDescriptor {
  input: OptionsInput
  queryOptions: unknown | undefined
}

interface QueryProxy {
  devices: {
    options: (input: OptionsInput, queryOptions?: unknown) => OptionsQueryDescriptor
  }
}

let requestedOptionInputs: OptionsInput[] = []
let requestedQueryOptions: unknown[] = []

const firstPageData = {
  devices: [
    {
      id: 'device-1',
      modelName: 'Pocket 5',
      brand: { id: 'brand-1', name: 'Retroid' },
      soc: null,
    },
  ],
  hasMore: true,
}

const secondPageData = {
  devices: [
    {
      id: 'device-2',
      modelName: 'Odin 2',
      brand: { id: 'brand-2', name: 'AYN' },
      soc: null,
    },
  ],
  hasMore: false,
}

function setupApiMocks() {
  requestedOptionInputs = []
  requestedQueryOptions = []
  apiMocks.useQueries.mockImplementation(
    (queryCallback: (proxy: QueryProxy) => OptionsQueryDescriptor[]) => {
      const descriptors = queryCallback({
        devices: {
          options: (input, queryOptionsInput) => ({
            input,
            queryOptions: queryOptionsInput,
          }),
        },
      })

      requestedOptionInputs = descriptors.map((descriptor) => descriptor.input)
      requestedQueryOptions = descriptors.map((descriptor) => descriptor.queryOptions)

      return descriptors.map((descriptor) => ({
        data: descriptor.input.offset === 0 ? firstPageData : secondPageData,
        isFetching: false,
      }))
    },
  )
  apiMocks.devicesGetByIdsUseQuery.mockImplementation((input: IdsInput) => ({
    data: input.ids.map((id) => ({
      id,
      modelName: 'Deck OLED',
      brand: { id: 'brand-selected', name: 'Steam' },
      soc: null,
    })),
  }))
}

describe('AsyncDeviceFilterSelect', () => {
  beforeAll(async () => {
    ;({ default: AsyncDeviceFilterSelect } = await import('./AsyncDeviceFilterSelect'))
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setupApiMocks()
  })

  it('loads devices through the slim options endpoint and selected labels through getByIds', () => {
    render(
      <AsyncDeviceFilterSelect label="Devices" value={['device-selected']} onChange={vi.fn()} />,
    )

    expect(screen.getByText('Steam Deck OLED')).toBeInTheDocument()
    expect(apiMocks.devicesGetByIdsUseQuery).toHaveBeenCalledWith(
      { ids: ['device-selected'] },
      expect.objectContaining({ enabled: true }),
    )
    expect(requestedOptionInputs).toEqual([
      { search: undefined, limit: LOOKUP_PAGINATION.DEFAULT_LIMIT, offset: 0 },
    ])
    expect(requestedQueryOptions[0]).toBeUndefined()

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    expect(screen.getByText('Retroid Pocket 5')).toBeInTheDocument()
  })

  it('keeps initially loaded options after the initial debounce window', () => {
    vi.useFakeTimers()

    try {
      render(<AsyncDeviceFilterSelect label="Devices" value={[]} onChange={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
      expect(screen.getByText('Retroid Pocket 5')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.getByText('Retroid Pocket 5')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('updates the search query and resets pagination', () => {
    vi.useFakeTimers()

    try {
      render(<AsyncDeviceFilterSelect label="Devices" value={[]} onChange={vi.fn()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
      fireEvent.change(screen.getByPlaceholderText('Search devices...'), {
        target: { value: 'odin' },
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(requestedOptionInputs).toEqual([
        { search: 'odin', limit: LOOKUP_PAGINATION.DEFAULT_LIMIT, offset: 0 },
      ])
      expect(requestedQueryOptions[0]).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('requests the next page when scrolled near the bottom', () => {
    render(<AsyncDeviceFilterSelect label="Devices" value={[]} onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Devices multi-select' }))
    const scrollContainer = screen.getByTestId('async-multi-select-options')
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 260, configurable: true })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 80, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 340, configurable: true })
    fireEvent.scroll(scrollContainer)

    expect(requestedOptionInputs).toEqual([
      { search: undefined, limit: LOOKUP_PAGINATION.DEFAULT_LIMIT, offset: 0 },
      {
        search: undefined,
        limit: LOOKUP_PAGINATION.DEFAULT_LIMIT,
        offset: LOOKUP_PAGINATION.DEFAULT_LIMIT,
      },
    ])
    expect(requestedQueryOptions[1]).toBeUndefined()
  })
})
