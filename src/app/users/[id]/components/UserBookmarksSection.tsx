'use client'

import BookmarkBrowser from '@/app/profile/components/bookmarks/BookmarkBrowser'

interface Props {
  userId: string
  ownProfile?: boolean
  handheldCount: number
  pcCount: number
}

export default function UserBookmarksSection(props: Props) {
  return <BookmarkBrowser key={props.userId} {...props} />
}
