'use client'

import { Bookmark } from 'lucide-react'
import PrivacyNote from '@/features/bookmarks/client/components/PrivacyNote'
import { api } from '@/lib/api'
import BookmarkBrowser from './bookmarks/BookmarkBrowser'
import SettingsSection from './SettingsSection'

interface Props {
  userId: string
}

export default function BookmarksManager(props: Props) {
  const counts = api.bookmarks.getCounts.useQuery({ userId: props.userId })
  return (
    <SettingsSection
      title="Bookmarks"
      description="Your saved compatibility reports for quick access"
      icon={<Bookmark className="w-6 h-6" />}
    >
      <PrivacyNote />
      <BookmarkBrowser
        key={props.userId}
        userId={props.userId}
        ownProfile
        handheldCount={
          counts.data?.visibility === 'visible' ? counts.data.counts.listingBookmarks : 0
        }
        pcCount={counts.data?.visibility === 'visible' ? counts.data.counts.pcListingBookmarks : 0}
      />
    </SettingsSection>
  )
}
