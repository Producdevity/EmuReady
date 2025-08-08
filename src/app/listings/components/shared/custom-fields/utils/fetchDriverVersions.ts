import axios from 'axios'

// ---------------------------------------------------------------------------
// Data models
// ---------------------------------------------------------------------------
export interface Asset {
  id: number
  name: string
  downloadUrl: string
  contentType: string
  size: number
}

export interface DriverRelease {
  id: string // caste
  name: string // What the UI shows
  label: string // Option label for dropdowns
  value: string // Option value for dropdowns
  tagName: string // Git tag
  publishedAt: string // ISO date string
  assets: Asset[]
  [key: string]: unknown
}

export interface DriverGroup {
  name: string
  releases: DriverRelease[]
  sort: number
}

export interface Repo {
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
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN || ''
/**
 * Fetches, normalises and sorts release data for all configured repos.
 * Lets hope we don't hit the the 60-requests-per-hour limit.
 * TODO: Supply a GitHub token to increase the limit to 5000 requests/hour. (and move to backend probably)
 */
export async function fetchDriverVersions(): Promise<DriverRelease[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (GITHUB_API_TOKEN) headers.Authorization = `Bearer ${GITHUB_API_TOKEN}`

  const tasks = repos.map(async (repo) => {
    try {
      const url = `${GITHUB_API_URL}/${repo.path}/releases?per_page=100`
      const { data } = await axios.get<GitHubRelease[]>(url, { headers })
      const releases: DriverRelease[] = data
        .map((rel) => ({
          id: rel.id.toString(),
          name: repo?.useTagName ? rel.tag_name : rel.name || rel.tag_name,
          label: `[${repo.name}] ${rel.name}`,
          value: `[${repo.path}] ${rel.name}`,
          tagName: rel.tag_name,
          publishedAt: rel.published_at,
          assets: rel.assets.map((a) => ({
            id: a.id,
            name: a.name,
            downloadUrl: a.browser_download_url,
            contentType: a.content_type,
            size: a.size,
          })),
        }))
        .toSorted(
          (a, b) =>
            repo.sortMode === 'PublishTime'
              ? new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
              : 0, // leave default GitHub order
        )
      return { name: repo.name, releases, sort: repo.sort }
    } catch (err) {
      console.error(`Failed to fetch ${repo.name}`, err)
      return { name: repo.name, releases: [], sort: repo.sort }
    }
  })

  const groups: DriverGroup[] = await Promise.all(tasks)
  return groups.toSorted((a, b) => a.sort - b.sort).flatMap((g) => g.releases)
}
