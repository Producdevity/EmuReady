import { type PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {
  className?: string
}

function Card(props: Props) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${props.className ?? ''}`}
    >
      {props.children}
    </div>
  )
}

export default Card
