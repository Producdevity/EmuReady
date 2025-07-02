'use client'

import { Shield, ShieldCheck, ShieldX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Input,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui'
import { api } from '@/lib/api'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'

interface Props {
  listingId: string
  emulatorId: string
  authorId: string
  isAlreadyVerified: boolean
  verificationId?: string
  onSuccess?: () => void
}

export default function VerifyListingButton(props: Props) {
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [isUnverifyDialogOpen, setIsUnverifyDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')

  const currentUserQuery = api.users.me.useQuery()
  const userId = currentUserQuery.data?.id

  // Check if user is verified developer for this emulator
  const verifiedDeveloperQuery = api.emulators.getVerifiedDeveloper.useQuery(
    { emulatorId: props.emulatorId },
    { enabled: !!userId && !!props.emulatorId },
  )

  const verifyMutation = api.listings.verifyListing.useMutation({
    onSuccess: () => {
      toast.success('Listing verified successfully')
      setIsVerifyDialogOpen(false)
      setNotes('')
      props.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify listing')
    },
  })

  const unverifyMutation = api.listings.unverifyListing.useMutation({
    onSuccess: () => {
      toast.success('Listing verification removed')
      setIsUnverifyDialogOpen(false)
      props.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove verification')
    },
  })

  const handleVerify = () => {
    verifyMutation.mutate({
      listingId: props.listingId,
      notes: notes.trim() || undefined,
    })
  }

  const handleUnverify = () => {
    unverifyMutation.mutate({
      listingId: props.listingId,
    })
  }

  // Don't show button if user is not logged in
  if (!currentUserQuery.data) {
    return null
  }

  // Don't show button if user is not a verified developer for this emulator
  if (!verifiedDeveloperQuery.data) {
    return null
  }

  // Don't show button if user is the author (can't verify own listings)
  if (props.authorId === userId) {
    return null
  }

  // Don't show button if user doesn't have at least DEVELOPER role
  if (!roleIncludesRole(currentUserQuery.data.role, Role.DEVELOPER)) {
    return null
  }

  const isLoading = verifyMutation.isPending || unverifyMutation.isPending

  if (props.isAlreadyVerified) {
    return (
      <AlertDialog
        open={isUnverifyDialogOpen}
        onOpenChange={setIsUnverifyDialogOpen}
      >
        <AlertDialogTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                <ShieldCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove verification</TooltipContent>
          </Tooltip>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your verification from this
              listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnverify}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              <ShieldX className="h-4 w-4 mr-2" />
              Remove Verification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
      <AlertDialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              <Shield className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Verify this listing</TooltipContent>
        </Tooltip>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Verify Listing</AlertDialogTitle>
          <AlertDialogDescription>
            As a verified developer for this emulator, you can verify that this
            listing is accurate and helpful to the community.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <label
            htmlFor="verification-notes"
            className="block text-sm font-medium mb-2"
          >
            Notes (optional)
          </label>
          <Input
            id="verification-notes"
            as="textarea"
            placeholder="Add any notes about this verification..."
            value={notes}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="text-xs text-gray-500 mt-1">
            {notes.length}/500 characters
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVerify}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verify Listing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
