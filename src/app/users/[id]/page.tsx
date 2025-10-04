import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generatePageMetadata } from '@/lib/seo/metadata'
import { getUserForSEO } from '@/server/db/seo-queries'
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

export default async function Page(props: Props) {
  const params = await props.params
  const user = await getUserForSEO(params.id)

  if (!user) notFound()

  return <UserProfilePage />
}
