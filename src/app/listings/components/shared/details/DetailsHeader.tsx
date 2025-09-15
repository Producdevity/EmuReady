'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  title: string
  gameUrl: string
  badges: ReactNode[]
}

export function DetailsHeader(props: Props) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
          {props.title}
        </h1>

        <Link
          href={props.gameUrl}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md self-start sm:self-auto"
        >
          View Game
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">{props.badges}</div>
    </>
  )
}
