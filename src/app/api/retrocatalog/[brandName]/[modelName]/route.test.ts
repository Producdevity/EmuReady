import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const request = new NextRequest('http://localhost/api/retrocatalog/Retroid/Pocket%205')

function contextFor(brandName: string, modelName: string) {
  return {
    params: Promise.resolve({ brandName, modelName }),
  }
}

describe('/api/retrocatalog/[brandName]/[modelName]', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an empty result when RetroCatalog rejects the lookup', async () => {
    vi.stubGlobal('fetch', async () => new Response('Forbidden', { status: 403 }))

    const response = await GET(request, contextFor('Retroid', 'Pocket 5'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('returns RetroCatalog matches when the lookup succeeds', async () => {
    const device = {
      modelName: 'Pocket 5',
      brandName: 'Retroid',
      id: 'retroid-pocket-5',
      url: 'https://retrocatalog.com/retro-handhelds/retroid-pocket-5',
    }
    vi.stubGlobal('fetch', async () => Response.json([device]))

    const response = await GET(request, contextFor('Retroid', 'Pocket 5'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([device])
  })

  it('keeps lookup parameters inside the RetroCatalog path', async () => {
    const fetch = vi.fn(async () => Response.json([]))
    vi.stubGlobal('fetch', fetch)

    await GET(request, contextFor('Retro/id', 'Pocket 5?x=1'))

    expect(fetch).toHaveBeenCalledWith(
      'https://retrocatalog.com/api/catalog/retro-handhelds/Retro%2Fid/Pocket%205%3Fx%3D1',
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 },
      },
    )
  })

  it('does not call RetroCatalog for invalid lookup parameters', async () => {
    const fetch = vi.fn(async () => Response.json([]))
    vi.stubGlobal('fetch', fetch)

    const emptyResponse = await GET(request, contextFor(' ', 'Pocket 5'))
    const controlCharacterResponse = await GET(request, contextFor('Retroid\n', 'Pocket 5'))

    expect(emptyResponse.status).toBe(200)
    expect(await emptyResponse.json()).toEqual([])
    expect(controlCharacterResponse.status).toBe(200)
    expect(await controlCharacterResponse.json()).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })
})
