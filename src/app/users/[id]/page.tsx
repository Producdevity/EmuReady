import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { generatePageMetadata } from '@/lib/seo/metadata'
import { getUserForSEO } from '@/server/db/seo-queries'
import UserProfilePageSkeleton from './components/UserProfilePageSkeleton'
import UserProfilePage from './UserProfilePage'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const user = await getUserForSEO(params.id)

  if (!user) return generatePageMetadata('User Not Found')

  const displayName = user.name || 'Anonymous User'
  const description = `View ${displayName}'s compatibility reports and contributions on EmuReady.`

  return generatePageMetadata(
    `${displayName} - User Profile`,
    description,
    `/users/${user.id}`,
    user.profileImage || undefined,
  )
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<UserProfilePageSkeleton />}>
      <UserPageContent params={props.params} />
    </Suspense>
  )
}

async function UserPageContent(props: Props) {
  const params = await props.params
  const user = await getUserForSEO(params.id)

  if (!user) notFound()

  return (
    <Suspense fallback={<UserProfilePageSkeleton />}>
      <UserProfilePage />
    </Suspense>
  )
}
