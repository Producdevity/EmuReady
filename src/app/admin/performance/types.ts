export interface PerformanceScale {
  id: number
  label: string
  description: string | null
  rank: number
}

export interface PerformanceScaleForDeletion {
  id: number
  label: string
  listingsCount: number
}

export interface PerformanceModalState {
  isOpen: boolean
  scale?: PerformanceScale
}

export interface ReplacementModalState {
  isOpen: boolean
  scaleToDelete: PerformanceScaleForDeletion | null
}
