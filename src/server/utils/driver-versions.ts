import axios, { type AxiosError } from 'axios'
import { logger } from '@/lib/logger'
import { driverVersionsCache } from '@/server/utils/cache/instances'
import { ms } from '@/utils/time'
import type { DriverAsset, DriverRelease, DriverVersionsResponse } from '@/types/driver-versions'

interface Repo {
  name: string
  path: string
  sort: number
  useTagName?: boolean
  sortMode?: 'PublishTime'
}

const repos: Repo[] = [
  { name: 'Mr. Purple Turnip', path: 'MrPurple666/purple-turnip', sort: 0 },
  {
    name: 'GameHub Adreno 8xx',
    path: 'crueter/GameHub-8Elite-Drivers',
    sort: 1,
  },
  {
    name: 'KIMCHI Turnip',
    path: 'K11MCH1/AdrenoToolsDrivers',
    sort: 2,
    useTagName: true,
    sortMode: 'PublishTime',
  },
  {
    name: 'Weab-Chan Freedreno',
    path: 'Weab-chan/freedreno_turnip-CI',
    sort: 3,
  },
]

interface GitHubAsset {
  id: number
  name: string
  browser_download_url: string
  content_type: string
  size: number
}

interface GitHubRelease {
  id: number
  tag_name: string
  name: string | null
  published_at: string
  assets: GitHubAsset[]
}

const GITHUB_API_URL = 'https://api.github.com/repos'
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN ?? ''
const CACHE_KEY = 'driverVersions'

function mapRelease(repo: Repo, rel: GitHubRelease): DriverRelease {
  const primaryAsset =
    rel.assets.find(
      (asset) => asset.name.endsWith('.adpkg') || asset.name.endsWith('.adpkg.zip'),
    ) ??
    rel.assets.find(
      (asset) => asset.name.endsWith('.zip') && !asset.name.toLowerCase().includes('source'),
    )

  const displayValue = `[${repo.name}] ${rel.name || rel.tag_name}`
  const filename = primaryAsset?.name ?? ''

  const assets: DriverAsset[] = rel.assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    downloadUrl: asset.browser_download_url,
    contentType: asset.content_type,
    size: asset.size,
  }))

  return {
    id: rel.id.toString(),
    name: repo.useTagName ? rel.tag_name : rel.name || rel.tag_name,
    label: displayValue,
    value: filename ? `${displayValue}|||${filename}` : displayValue,
    tagName: rel.tag_name,
    publishedAt: rel.published_at,
    assets,
  }
}

function sortReleases(repo: Repo, releases: DriverRelease[]): DriverRelease[] {
  if (repo.sortMode === 'PublishTime') {
    return releases
      .slice()
      .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
  }

  return releases
}

function isRateLimitError(error: unknown): boolean {
  const axiosError = error as AxiosError<{ message?: string } | undefined>
  if (!axiosError || !axiosError.response) return false

  if (axiosError.response.status !== 403) return false

  const message = axiosError.response.data?.message ?? ''
  if (message.toLowerCase().includes('rate limit')) return true

  const remaining = axiosError.response.headers?.['x-ratelimit-remaining']
  return typeof remaining === 'string' && remaining === '0'
}

async function fetchFromGitHub(): Promise<DriverRelease[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'EmuReady-App',
  }

  if (GITHUB_API_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_API_TOKEN}`
  }

  const tasks = repos.map(async (repo) => {
    const url = `${GITHUB_API_URL}/${repo.path}/releases?per_page=100`
    const { data } = await axios.get<GitHubRelease[]>(url, { headers })

    const releases = data.map((rel) => mapRelease(repo, rel))
    return { sort: repo.sort, releases: sortReleases(repo, releases) }
  })

  const grouped = await Promise.all(tasks)
  return grouped.sort((a, b) => a.sort - b.sort).flatMap((group) => group.releases)
}

export async function getDriverVersions(): Promise<DriverVersionsResponse> {
  const cached = driverVersionsCache.get(CACHE_KEY)
  if (cached) return cached

  try {
    const releases = await fetchFromGitHub()
    const payload: DriverVersionsResponse = {
      releases,
      rateLimited: false,
    }
    driverVersionsCache.set(CACHE_KEY, payload, ms.minutes(30))
    return payload
  } catch (error) {
    if (isRateLimitError(error)) {
      logger.warn('GitHub rate limit reached while fetching driver versions')
      const payload: DriverVersionsResponse = {
        releases: [],
        rateLimited: true,
        errorMessage: 'GitHub rate limit exceeded. Try again in a few minutes.',
      }
      driverVersionsCache.set(CACHE_KEY, payload, ms.minutes(5))
      return payload
    }

    logger.error('Failed to fetch driver versions from GitHub', error)
    const payload: DriverVersionsResponse = {
      releases: [],
      rateLimited: false,
      errorMessage: 'Failed to fetch driver versions. Please try again later.',
    }
    driverVersionsCache.set(CACHE_KEY, payload, ms.minutes(2))
    return payload
  }
}
