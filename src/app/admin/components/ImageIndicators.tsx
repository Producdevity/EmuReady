interface GameWithImages {
  boxartUrl?: string | null
  bannerUrl?: string | null
  imageUrl?: string | null
}

interface Props {
  game: GameWithImages
  size?: 'sm' | 'md'
}

function ImageIndicators(props: Props) {
  const { game, size = 'sm' } = props

  const dotSize = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'

  return (
    <div className="flex gap-0.5">
      {game.boxartUrl && (
        <div className={`${dotSize} bg-blue-500 rounded-full`} title="Box Art available" />
      )}
      {game.bannerUrl && (
        <div className={`${dotSize} bg-green-500 rounded-full`} title="Banner available" />
      )}
      {game.imageUrl && (
        <div className={`${dotSize} bg-purple-500 rounded-full`} title="Main Image available" />
      )}
    </div>
  )
}

export default ImageIndicators
