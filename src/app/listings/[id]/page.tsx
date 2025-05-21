import { type Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getListingById, getListingUpVotes, getListingVotes } from './data'
import ListingDetailsClient from './components/ListingDetailsClient'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import sanitizeForClient from '@/utils/sanitizeForClient'

export const metadata: Metadata = {
  title: 'Listing Details',
  description: 'View listing details and compatibility listings',
}

interface Props {
  params: Promise<{ id: string }>
}

async function ListingDetailsPage(props: Props) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)

  // Fetch the listing directly from the database using Prisma
  const listing = await getListingById(id)

  if (!listing) notFound()

  // Get vote counts and user's vote if logged in
  const upVotes = await getListingUpVotes(listing.id)
  const totalVotes = listing._count.votes
  const successRate = totalVotes > 0 ? upVotes / totalVotes : 0

  // Get user's vote if logged in
  let userVote: boolean | null = null
  if (session?.user?.id) {
    const votes = await getListingVotes(listing.id, session.user.id)
    userVote = votes.length > 0 ? votes[0].value : null
  }

  return (
    <ListingDetailsClient
      listing={sanitizeForClient(listing)}
      successRate={successRate}
      upVotes={upVotes}
      totalVotes={totalVotes}
      userVote={userVote}
    />
  )
}

export default ListingDetailsPage
