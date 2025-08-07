import { type Metadata } from 'next'
import { type PropsWithChildren } from 'react'

export const metadata: Metadata = {
  title: 'Delete Account - EmuReady',
  description:
    'Delete your EmuReady account and all associated data. This action is permanent and cannot be undone.',
  robots: 'noindex, nofollow', // Don't index this page in search engines
}

export default function AccountDeleteLayout(props: PropsWithChildren) {
  return <>{props.children}</>
}
