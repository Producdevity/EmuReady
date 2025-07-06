export interface PcListingsFilter {
  page?: number
  limit?: number
  searchTerm?: string
  cpuIds?: string[]
  gpuIds?: string[]
  systemIds?: string[]
  performanceIds?: number[]
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
