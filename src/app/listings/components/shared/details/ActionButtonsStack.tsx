'use client'

import { type PropsWithChildren } from 'react'

export function ActionButtonsStack(props: PropsWithChildren) {
  return (
    <div className="mt-2 flex flex-col gap-2 w-full items-center md:items-stretch">
      {props.children}
    </div>
  )
}
