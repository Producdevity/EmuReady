'use client'

import { Gamepad2 } from 'lucide-react'
import { useState } from 'react'
import GameFollowRow from '@/components/game-follows/GameFollowRow'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { api } from '@/lib/api'
import ModalListContent from './ModalListContent'

interface Props {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function GameFollowListModal(props: Props) {
  const [page, setPage] = useState(1)
  const limit = 20

  const query = api.gameFollows.getFollowedGames.useQuery(
    { userId: props.userId, page, limit },
    { enabled: props.open },
  )

  const data = query.data

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Games Followed</DialogTitle>
        </DialogHeader>

        <ModalListContent
          isPending={query.isPending}
          error={query.error}
          visibility={data?.visibility}
          itemCount={data?.visibility === 'visible' ? data.items.length : 0}
          icon={Gamepad2}
          emptyMessage="Not following any games yet"
          errorMessage="Failed to load followed games. Please try again."
          pagination={
            data?.visibility === 'visible'
              ? { ...data.pagination, onPageChange: setPage }
              : undefined
          }
        >
          {data?.visibility === 'visible' &&
            data.items.map((item) => (
              <GameFollowRow
                key={item.id}
                item={item}
                size="md"
                showDate={false}
                onClick={() => props.onOpenChange(false)}
              />
            ))}
        </ModalListContent>
      </DialogContent>
    </Dialog>
  )
}

export default GameFollowListModal
