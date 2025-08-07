import { type Metadata } from 'next'
import { type PropsWithChildren } from 'react'

export const metadata: Metadata = {
  title: 'Download Your Data - EmuReady',
  description:
    'Download a copy of all your EmuReady data including profile, listings, comments, and more.',
  robots: 'noindex, nofollow',
}

export default function DataExportLayout(props: PropsWithChildren) {
  return <>{props.children}</>
}
