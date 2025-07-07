export interface PcListingsFilter {
  page?: number
  limit?: number
  searchTerm?: string
  cpuIds?: string[]
  gpuIds?: string[]
  systemIds?: string[]
  emulatorIds?: string[]
  performanceIds?: number[]
  minMemory?: number
  maxMemory?: number
  sortField?:
    | 'game.title'
    | 'game.system.name'
    | 'cpu'
    | 'gpu'
    | 'emulator.name'
    | 'performance.rank'
    | 'author.name'
    | 'memorySize'
    | 'createdAt'
  sortDirection?: 'asc' | 'desc'
  myListings?: boolean
}
