import Image from 'next/image'
import segaSaturnIcon from './assets/SegaSaturnIcon.svg'

function SegaSaturnIcon() {
  return (
    <Image
      src={segaSaturnIcon}
      width={100}
      height={100}
      className="w-4 h-4"
      alt="Sega Dreamcast"
    />
  )
}

export default SegaSaturnIcon
