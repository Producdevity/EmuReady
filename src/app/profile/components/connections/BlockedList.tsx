'use client'

import { Ban } from 'lucide-react'
import { Button, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { SocialConnectionList } from './SocialConnectionList'

interface Props {
  page: number
  limit: number
  search: string
  onPageChange: (page: number) => void
}

function BlockedList(props: Props) {
  const utils = api.useUtils()
  const confirm = useConfirmDialog()

  const query = api.social.getBlockedUsers.useQuery({
    page: props.page,
    limit: props.limit,
    search: props.search || undefined,
  })

  const unblockMutation = api.social.unblockUser.useMutation({
    onSuccess: () => {
      toast.success('User unblocked')
      utils.social.getBlockedUsers.invalidate().catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleUnblock = async (userId: string, userName: string | null) => {
    const confirmed = await confirm({
      title: 'Unblock User',
      description: `Are you sure you want to unblock ${userName ?? 'this user'}? They will be able to interact with your profile again.`,
      confirmText: 'Unblock',
    })
    if (!confirmed) return
    unblockMutation.mutate({ userId })
  }

  return (
    <SocialConnectionList
      items={query.data?.items.map((item) => ({ id: item.id, user: item.receiver }))}
      isPending={query.isPending}
      pagination={query.data?.pagination}
      onPageChange={props.onPageChange}
      emptyMessage="No blocked users"
      renderAction={(user) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUnblock(user.id, user.name)}
          disabled={unblockMutation.isPending}
          icon={Ban}
        >
          Unblock
        </Button>
      )}
    />
  )
}

export default BlockedList
