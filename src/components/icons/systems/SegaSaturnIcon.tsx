import Image from 'next/image'
import SegaSaturnIcon from './assets/SegaSaturnIcon.png'

function SegaSaturnIconComponent() {
  return (
    <Image
      src={SegaSaturnIcon}
      alt="Sega Saturn"
      width={100}
      height={100}
      className="w-full h-full object-contain"
      unoptimized
    />
  )
}

export default SegaSaturnIconComponent
