import { Gamepad2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface GameImageProps {
  src: string
  alt: string
}

export function GameSearchResultImage(props: GameImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Gamepad2 className="h-16 w-16 text-slate-300 dark:text-slate-600" />
      </div>
    )
  }

  return (
    <Image
      src={props.src}
      alt={props.alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={() => setHasError(true)}
    />
  )
}
