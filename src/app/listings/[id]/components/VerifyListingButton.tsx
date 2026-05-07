'use client'

import GenericVerifyButton from '@/components/verify/GenericVerifyButton'
import { type ListingType } from '@/lib/api/useListingApi'

interface Props {
  listingId: string
  listingType: ListingType
  emulatorId: string
  authorId: string
  isAlreadyVerified: boolean
  verificationId?: string
  onSuccess?: () => void
}

export default function VerifyListingButton(props: Props) {
  const genericType = props.listingType === 'pc' ? 'pcListing' : 'listing'
  return (
    <GenericVerifyButton
      listingId={props.listingId}
      emulatorId={props.emulatorId}
      authorId={props.authorId}
      isAlreadyVerified={props.isAlreadyVerified}
      verificationId={props.verificationId}
      onSuccess={props.onSuccess}
      type={genericType}
    />
  )
}
