import { cn } from '@/lib/utils'
import Image from 'next/image'
import { OptimizedImage } from '@/components/ui'
import getImageUrl from '@/app/games/utils/getImageUrl'

interface Props {
  boxartUrl?: string | null
  imageUrl?: string | null
  title: string
  width?: number
  height?: number
  className?: string
}

const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 400

function GameBoxartImage(props: Props) {
  // Use boxartUrl first, fallback to imageUrl
  const displayImageUrl = props.boxartUrl ?? props.imageUrl

  return (
    <div className={cn('w-full md:w-1/4 flex-shrink-0', props.className)}>
      {displayImageUrl ? (
        <OptimizedImage
          src={getImageUrl(displayImageUrl, props.title)}
          alt={props.title}
          width={props.width ?? DEFAULT_WIDTH}
          height={props.height ?? DEFAULT_HEIGHT}
          className="w-full max-h-96 rounded-lg shadow-md"
          imageClassName="w-full max-h-96"
          objectFit="contain"
          fallbackSrc="/placeholder/game.svg"
          priority
        />
      ) : (
        <Image
          src="/placeholder/game.svg"
          alt="No image available"
          className="w-full h-auto rounded-lg shadow-md"
          width={props.width ?? DEFAULT_WIDTH}
          height={props.height ?? DEFAULT_HEIGHT}
          unoptimized
        />
      )}
    </div>
  )
}

export default GameBoxartImage
