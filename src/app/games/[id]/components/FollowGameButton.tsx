'use client'

import { useUser } from '@clerk/nextjs'
import { Bell, BellOff } from 'lucide-react'
import { useState } from 'react'
import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui'
import { STALE_TIMES } from '@/data/constants'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { ApprovalStatus } from '@orm'

interface Props {
  gameId: string
  gameStatus: ApprovalStatus
}

function FollowGameButton(props: Props) {
  const { user } = useUser()
  const utils = api.useUtils()
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null)

  const statusQuery = api.gameFollows.isFollowing.useQuery(
    { gameId: props.gameId },
    { enabled: !!user, staleTime: STALE_TIMES.USER_ACTION },
  )

  const onError = (error: unknown) => {
    setOptimisticFollowing(null)
    toast.error(getErrorMessage(error))
  }

  const followMutation = api.gameFollows.follow.useMutation({
    onSuccess: async () => {
      await utils.gameFollows.isFollowing.invalidate({ gameId: props.gameId })
      setOptimisticFollowing(null)
      utils.gameFollows.getGameFollowCount.invalidate()
      utils.gameFollows.getFollowedGames.invalidate()
      toast.success('You will be notified when new reports are added for this game')
    },
    onError,
  })

  const unfollowMutation = api.gameFollows.unfollow.useMutation({
    onSuccess: async () => {
      await utils.gameFollows.isFollowing.invalidate({ gameId: props.gameId })
      setOptimisticFollowing(null)
      utils.gameFollows.getGameFollowCount.invalidate()
      utils.gameFollows.getFollowedGames.invalidate()
    },
    onError,
  })

  if (!user) return null
  if (props.gameStatus !== ApprovalStatus.APPROVED) return null

  const isFollowing = optimisticFollowing ?? statusQuery.data?.isFollowing ?? false
  const isPending = followMutation.isPending || unfollowMutation.isPending

  const handleToggle = () => {
    if (isPending) return

    setOptimisticFollowing(!isFollowing)

    if (isFollowing) {
      unfollowMutation.mutate({ gameId: props.gameId })
    } else {
      followMutation.mutate({ gameId: props.gameId })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          icon={isFollowing ? BellOff : Bell}
          onClick={handleToggle}
          disabled={isPending || statusQuery.isPending}
          aria-pressed={isFollowing}
          aria-label={isFollowing ? 'Unfollow game' : 'Follow game'}
          className={
            isFollowing
              ? 'text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600'
          }
        >
          {isFollowing ? 'Following' : 'Follow Game'}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isFollowing
          ? 'You are receiving notifications for new reports on this game'
          : 'Get notified when new compatibility reports are added'}
      </TooltipContent>
    </Tooltip>
  )
}

export default FollowGameButton
