'use client'

import { type PropsWithChildren } from 'react'

export function ActionButtonsStack(props: PropsWithChildren) {
  return <div className="mt-2 flex flex-col gap-2">{props.children}</div>
}
