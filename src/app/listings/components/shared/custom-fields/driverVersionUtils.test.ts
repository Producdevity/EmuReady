import { describe, it, expect } from 'vitest'
import {
  findDriverReleaseByFilename,
  reconcileDriverValue,
  normalizeFilename,
} from './driverVersionUtils'
import type { DriverRelease } from './hooks/useDriverVersions'

const releases: DriverRelease[] = [
  {
    id: '1',
    name: 'turnip_A.zip',
    label: '[Repo] turnip_A.zip',
    value: '[Repo] turnip_A.zip|||turnip_A.zip',
    tagName: 'v1',
    publishedAt: '2025-01-01T00:00:00Z',
    assets: [
      { id: 1, name: 'turnip_A.zip', downloadUrl: '', contentType: 'application/zip', size: 1 },
    ],
  },
  {
    id: '2',
    name: 'turnip_B',
    label: '[Repo] turnip_B',
    value: '[Repo] turnip_B',
    tagName: 'v2',
    publishedAt: '2025-01-02T00:00:00Z',
    assets: [
      { id: 2, name: 'turnip_B.zip', downloadUrl: '', contentType: 'application/zip', size: 1 },
    ],
  },
]

describe('driverVersionUtils', () => {
  it('normalizes filename from path', () => {
    expect(normalizeFilename('/a/b/c/file.zip')).toBe('file.zip')
    expect(normalizeFilename('file.zip')).toBe('file.zip')
    expect(normalizeFilename('')).toBe('')
  })

  it('finds release by filename via value suffix', () => {
    const match = findDriverReleaseByFilename(releases, 'turnip_A.zip')
    expect(match?.id).toBe('1')
  })

  it('finds release by filename via assets', () => {
    const match = findDriverReleaseByFilename(releases, 'turnip_B.zip')
    expect(match?.id).toBe('2')
  })

  it('reconciles plain filename to canonical value', () => {
    const canonical = reconcileDriverValue('turnip_A.zip', releases)
    expect(canonical).toBe('[Repo] turnip_A.zip|||turnip_A.zip')
  })

  it('returns null when current is already canonical or not found', () => {
    expect(reconcileDriverValue('[Repo] turnip_A.zip|||turnip_A.zip', releases)).toBeNull()
    expect(reconcileDriverValue('unknown.zip', releases)).toBeNull()
  })
})
