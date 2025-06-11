import { cn } from '@/lib/utils'
import { OptimizedImage } from '@/components/ui'
import getGameImageUrl from '@/utils/images/getGameImageUrl'
import { type Game } from '@orm'

interface Props {
  game: Game
  width?: number
  height?: number
  className?: string
}

const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 400

function GameBoxartImage(props: Props) {
  return (
    <div className={cn('w-full md:w-1/4 flex-shrink-0', props.className)}>
      <OptimizedImage
        src={getGameImageUrl(props.game)}
        alt={props.game.title}
        width={props.width ?? DEFAULT_WIDTH}
        height={props.height ?? DEFAULT_HEIGHT}
        className="w-full max-h-96 rounded-lg shadow-md"
        imageClassName="w-full max-h-96"
        objectFit="contain"
        fallbackSrc="/placeholder/game.svg"
        priority
      />
    </div>
  )
}

export default GameBoxartImage
