export interface PaginationResult<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface BaseUser {
  id: string
  showNsfw: boolean
}

export interface BaseFindParams {
  page?: number
  limit?: number
  search?: string
  user?: BaseUser | null
}
