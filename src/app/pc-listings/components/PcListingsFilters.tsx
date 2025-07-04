'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AsyncMultiSelect } from '@/components/ui/form/AsyncMultiSelect'
import { Input } from '@/components/ui/form/Input'
import { MultiSelect } from '@/components/ui/form/MultiSelect'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { parseArrayParam, parseNumberArrayParam } from '@/utils/parse-params'
import { PcOs } from '@orm'

export function PcListingsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse current filters from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedSystems, setSelectedSystems] = useState<string[]>(
    parseArrayParam(searchParams.get('systemIds')),
  )
  const [selectedCpus, setSelectedCpus] = useState<string[]>(
    parseArrayParam(searchParams.get('cpuIds')),
  )
  const [selectedGpus, setSelectedGpus] = useState<string[]>(
    parseArrayParam(searchParams.get('gpuIds')),
  )
  const [selectedEmulators, setSelectedEmulators] = useState<string[]>(
    parseArrayParam(searchParams.get('emulatorIds')),
  )
  const [selectedPerformance, setSelectedPerformance] = useState<number[]>(
    parseNumberArrayParam(searchParams.get('performanceIds')),
  )
  const [selectedOs, setSelectedOs] = useState<PcOs[]>(
    parseArrayParam(searchParams.get('osFilter')) as PcOs[],
  )
  const [memoryMin, setMemoryMin] = useState(
    searchParams.get('memoryMin') || '',
  )
  const [memoryMax, setMemoryMax] = useState(
    searchParams.get('memoryMax') || '',
  )

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const debouncedMemoryMin = useDebouncedValue(memoryMin, 300)
  const debouncedMemoryMax = useDebouncedValue(memoryMax, 300)

  const utils = api.useUtils()

  // Fetch filter options
  const systemsQuery = api.systems.get.useQuery()
  const emulatorsQuery = api.emulators.get.useQuery({ limit: 100 })
  const performanceScalesQuery = api.listings.performanceScales.useQuery()

  // Async loaders for CPU and GPU
  const loadCpuOptions = useCallback(
    async (search: string) => {
      if (search.length < 2) return Promise.resolve([])
      try {
        const result = await utils.cpus.get.fetch({ search, limit: 50 })
        return result.cpus.map((cpu) => ({
          id: cpu.id,
          name: `${cpu.brand.name} ${cpu.modelName}`,
        }))
      } catch (error) {
        console.error('Error fetching CPUs:', error)
        return []
      }
    },
    [utils.cpus.get],
  )

  const loadGpuOptions = useCallback(
    async (search: string) => {
      if (search.length < 2) return Promise.resolve([])
      try {
        const result = await utils.gpus.get.fetch({ search, limit: 50 })
        return result.gpus.map((gpu) => ({
          id: gpu.id,
          name: `${gpu.brand.name} ${gpu.modelName}`,
        }))
      } catch (error) {
        console.error('Error fetching GPUs:', error)
        return []
      }
    },
    [utils.gpus.get],
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    // Reset to page 1 when filters change (don't include current page param)
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
    if (selectedSystems.length)
      params.set('systemIds', JSON.stringify(selectedSystems))
    if (selectedCpus.length) params.set('cpuIds', JSON.stringify(selectedCpus))
    if (selectedGpus.length) params.set('gpuIds', JSON.stringify(selectedGpus))
    if (selectedEmulators.length)
      params.set('emulatorIds', JSON.stringify(selectedEmulators))
    if (selectedPerformance.length)
      params.set('performanceIds', JSON.stringify(selectedPerformance))
    if (selectedOs.length) params.set('osFilter', JSON.stringify(selectedOs))
    if (debouncedMemoryMin) params.set('memoryMin', debouncedMemoryMin)
    if (debouncedMemoryMax) params.set('memoryMax', debouncedMemoryMax)

    const url = params.toString() ? `?${params.toString()}` : '/pc-listings'
    router.replace(url, { scroll: false })
  }, [
    debouncedSearchTerm,
    selectedSystems,
    selectedCpus,
    selectedGpus,
    selectedEmulators,
    selectedPerformance,
    selectedOs,
    debouncedMemoryMin,
    debouncedMemoryMax,
    router,
  ])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSystems([])
    setSelectedCpus([])
    setSelectedGpus([])
    setSelectedEmulators([])
    setSelectedPerformance([])
    setSelectedOs([])
    setMemoryMin('')
    setMemoryMax('')
  }

  const hasFilters =
    searchTerm ||
    selectedSystems.length ||
    selectedCpus.length ||
    selectedGpus.length ||
    selectedEmulators.length ||
    selectedPerformance.length ||
    selectedOs.length ||
    memoryMin ||
    memoryMax

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search games, hardware, emulators..."
              value={searchTerm}
              onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(ev.target.value)
              }
            />
          </div>

          {/* Systems */}
          {systemsQuery.data && (
            <MultiSelect
              label="Systems"
              value={selectedSystems}
              onChange={setSelectedSystems}
              options={systemsQuery.data.map((system) => ({
                id: system.id,
                name: system.name,
              }))}
              placeholder="Select systems..."
              maxDisplayed={2}
            />
          )}

          {/* CPUs */}
          <AsyncMultiSelect
            label="CPUs"
            value={selectedCpus}
            onChange={setSelectedCpus}
            loadOptions={loadCpuOptions}
            placeholder="Select CPUs..."
            emptyMessage="No CPUs found"
            maxSelected={5}
          />

          {/* GPUs */}
          <AsyncMultiSelect
            label="GPUs"
            value={selectedGpus}
            onChange={setSelectedGpus}
            loadOptions={loadGpuOptions}
            placeholder="Select GPUs..."
            emptyMessage="No GPUs found"
            maxSelected={5}
          />

          {/* Emulators */}
          {emulatorsQuery.data?.emulators && (
            <MultiSelect
              label="Emulators"
              value={selectedEmulators}
              onChange={setSelectedEmulators}
              options={emulatorsQuery.data.emulators.map((emulator) => ({
                id: emulator.id,
                name: emulator.name,
              }))}
              placeholder="Select emulators..."
              maxDisplayed={2}
            />
          )}

          {/* Performance */}
          {performanceScalesQuery.data && (
            <MultiSelect
              label="Performance"
              value={selectedPerformance.map(String)}
              onChange={(values) => setSelectedPerformance(values.map(Number))}
              options={performanceScalesQuery.data.map((scale) => ({
                id: scale.id.toString(),
                name: scale.label,
              }))}
              placeholder="Select performance levels..."
              maxDisplayed={2}
            />
          )}

          {/* Operating System */}
          <MultiSelect
            label="Operating System"
            value={selectedOs}
            onChange={(values: string[]) => setSelectedOs(values as PcOs[])}
            options={[
              { id: PcOs.WINDOWS, name: 'Windows' },
              { id: PcOs.LINUX, name: 'Linux' },
              { id: PcOs.MACOS, name: 'macOS' },
            ]}
            placeholder="Select OS..."
            maxDisplayed={2}
          />

          {/* Memory Range */}
          <div>
            <label className="text-sm font-medium">Memory (GB)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={memoryMin}
                onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                  setMemoryMin(ev.target.value)
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={memoryMax}
                onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                  setMemoryMax(ev.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
