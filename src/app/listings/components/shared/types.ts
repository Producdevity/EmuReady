import { type AutocompleteOptionBase } from '@/components/ui'
import type { ApprovalStatus } from '@orm'

export interface GameOption extends AutocompleteOptionBase {
  id: string
  title: string
  system: {
    id: string
    name: string
  }
  status: ApprovalStatus
}

export interface EmulatorOption extends AutocompleteOptionBase {
  id: string
  name: string
  systems: Array<{
    id: string
    name: string
  }>
}

export interface DeviceOption extends AutocompleteOptionBase {
  id: string
  brand: {
    id: string
    name: string
  }
  modelName: string
  soc: {
    id: string
    name: string
    manufacturer: string
  }
}

export interface PerformanceScale {
  id: string
  label: string
  rank: number
  description: string | null
}
