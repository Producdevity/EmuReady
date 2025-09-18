export interface DriverAsset {
  id: number
  name: string
  downloadUrl: string
  contentType: string
  size: number
}

export interface DriverRelease {
  id: string
  name: string
  label: string
  value: string
  tagName: string
  publishedAt: string
  assets: DriverAsset[]
  [key: string]: unknown
}

export interface DriverVersionsResponse {
  releases: DriverRelease[]
  rateLimited: boolean
  errorMessage?: string
}
