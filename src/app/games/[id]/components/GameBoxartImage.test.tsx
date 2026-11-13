import { act, render, screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus, Role, type Game } from '@orm'
import { GameBoxartImage } from './GameBoxartImage'
import type * as Ui from '@/components/ui'

type ImageResult = Pick<Game, 'imageUrl' | 'boxartUrl' | 'bannerUrl'>
interface MutationOptions {
  onSuccess: (result: ImageResult | null) => Promise<void>
  onError: (error: Error) => void
}
const recordMutation = vi.hoisted(() => vi.fn<(options: MutationOptions) => void>())
vi.mock('@clerk/nextjs', () => ({ useUser: () => ({ user: { id: 'user-1' } }) }))
vi.mock('@/lib/toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/api', () => ({
  api: {
    useUtils: () => ({ games: { byId: { invalidate: vi.fn().mockResolvedValue(undefined) } } }),
    users: { me: { useQuery: () => ({ data: { id: 'user-1', role: Role.MODERATOR } }) } },
    games: {
      update: {
        useMutation: (options: MutationOptions) => {
          recordMutation(options)
          return { mutate: vi.fn(), isPending: false }
        },
      },
    },
  },
}))
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof Ui>()
  function ImagePreview(props: Pick<ComponentProps<typeof Ui.OptimizedImage>, 'src' | 'alt'>) {
    return <div role="img" aria-label={props.alt} data-source={props.src} />
  }
  return { ...actual, OptimizedImage: ImagePreview }
})

function game(id: string, imageUrl: string | null): Game {
  return {
    id,
    title: `Game ${id}`,
    normalizedTitle: null,
    systemId: 'system-1',
    imageUrl,
    boxartUrl: null,
    bannerUrl: null,
    tgdbGameId: null,
    metadata: null,
    isErotic: false,
    ageRating: null,
    status: ApprovalStatus.APPROVED,
    submittedBy: null,
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date('2026-01-01'),
  }
}
async function acknowledge(images: ImageResult) {
  const callback = recordMutation.mock.lastCall?.[0].onSuccess
  if (!callback) throw new Error('Image update callback was not registered')
  await act(() => callback(images))
}
beforeEach(() => vi.clearAllMocks())

describe('game image acknowledgements', () => {
  it('keeps a confirmed image until refreshed server images arrive', async () => {
    const original = game('one', 'https://example.com/one.webp')
    const view = render(<GameBoxartImage game={original} />)
    await acknowledge({
      imageUrl: 'https://example.com/confirmed.webp',
      boxartUrl: null,
      bannerUrl: null,
    })
    expect(screen.getByRole('img')).toHaveAttribute(
      'data-source',
      'https://example.com/confirmed.webp',
    )
    view.rerender(
      <GameBoxartImage game={{ ...original, imageUrl: 'https://example.com/refreshed.webp' }} />,
    )
    expect(screen.getByRole('img')).toHaveAttribute(
      'data-source',
      'https://example.com/refreshed.webp',
    )
  })

  it('uses the confirmed empty images for fallback instead of resurrecting an old cover', async () => {
    const original = game('one', 'https://example.com/one.webp')
    render(<GameBoxartImage game={original} />)
    await acknowledge({ imageUrl: null, boxartUrl: null, bannerUrl: null })
    expect(screen.getByRole('img')).not.toHaveAttribute('data-source', original.imageUrl)
  })

  it('does not carry a confirmed image into a different game', async () => {
    const view = render(<GameBoxartImage game={game('one', 'https://example.com/one.webp')} />)
    await acknowledge({
      imageUrl: 'https://example.com/confirmed.webp',
      boxartUrl: null,
      bannerUrl: null,
    })
    view.rerender(<GameBoxartImage game={game('two', 'https://example.com/two.webp')} />)
    expect(screen.getByRole('img')).toHaveAttribute('data-source', 'https://example.com/two.webp')
  })
})
