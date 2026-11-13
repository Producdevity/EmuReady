'use client'

import BookmarkBrowserView from '@/features/bookmarks/client/components/BookmarkBrowser'
import { useBookmarkBrowser } from '@/features/bookmarks/client/hooks/useBookmarkBrowser'
import AsyncCpuFilterSelect from '@/features/hardware/cpu/client/components/AsyncCpuFilterSelect'
import DeviceMultiSelect from '@/features/hardware/device/client/components/DeviceMultiSelect'
import AsyncGpuFilterSelect from '@/features/hardware/gpu/client/components/AsyncGpuFilterSelect'
import SocMultiSelect from '@/features/hardware/soc/client/components/SocMultiSelect'

interface Props {
  userId: string
  handheldCount: number
  pcCount: number
  ownProfile?: boolean
}

export default function BookmarkBrowser(props: Props) {
  const browser = useBookmarkBrowser()
  const filters = browser.filters
  return (
    <BookmarkBrowserView {...props} browser={browser}>
      {browser.variant === 'handheld' ? (
        <>
          <DeviceMultiSelect
            label="Devices"
            value={filters.deviceIds}
            onChange={(deviceIds) => browser.changeFilters({ ...filters, deviceIds })}
            maxDisplayed={1}
            placeholder="All devices"
          />
          <SocMultiSelect
            label="SoCs"
            value={filters.socIds}
            onChange={(socIds) => browser.changeFilters({ ...filters, socIds })}
            maxDisplayed={1}
            placeholder="All SoCs"
          />
        </>
      ) : (
        <>
          <AsyncCpuFilterSelect
            label="CPUs"
            value={filters.cpuIds}
            onChange={(cpuIds) => browser.changeFilters({ ...filters, cpuIds })}
            maxDisplayed={1}
            placeholder="All CPUs"
          />
          <AsyncGpuFilterSelect
            label="GPUs"
            value={filters.gpuIds}
            onChange={(gpuIds) => browser.changeFilters({ ...filters, gpuIds })}
            maxDisplayed={1}
            placeholder="All GPUs"
          />
        </>
      )}
    </BookmarkBrowserView>
  )
}
