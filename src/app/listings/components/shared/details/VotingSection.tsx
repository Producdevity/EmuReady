'use client'

import { forwardRef, type PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {
  title?: string
  id?: string
}

export const VotingSection = forwardRef<HTMLDivElement, Props>(function VotingSection(props, ref) {
  const title = props.title ?? 'Success Rate'
  return (
    <div className="mb-6" id={props.id} ref={ref}>
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{title}</h2>
      {props.children}
    </div>
  )
})
