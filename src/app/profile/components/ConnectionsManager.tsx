'use client'

import { Users } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'
import BlockedList from './connections/BlockedList'
import FollowersList from './connections/FollowersList'
import FollowingList from './connections/FollowingList'
import FriendsList from './connections/FriendsList'
import SettingsSection from './SettingsSection'

type SubTab = 'followers' | 'following' | 'friends' | 'blocked'

interface Props {
  userId: string
}

function ConnectionsManager(props: Props) {
  const [subTab, setSubTab] = useState<SubTab>('followers')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const limit = 20

  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab)
    setPage(1)
    setSearch('')
  }

  return (
    <SettingsSection
      title="Connections"
      description="Manage your followers, following, friends, and blocked users"
      icon={<Users className="w-6 h-6" />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {(['followers', 'following', 'friends', 'blocked'] as const).map((tab) => (
            <Button
              key={tab}
              variant={subTab === tab ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleSubTabChange(tab)}
              className={cn('capitalize', subTab === tab && 'shadow-sm')}
            >
              {tab}
            </Button>
          ))}
        </div>

        <Input
          placeholder="Search connections..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-sm"
        />

        {subTab === 'followers' && (
          <FollowersList
            userId={props.userId}
            page={page}
            limit={limit}
            search={debouncedSearch}
            onPageChange={setPage}
          />
        )}
        {subTab === 'following' && (
          <FollowingList
            userId={props.userId}
            page={page}
            limit={limit}
            search={debouncedSearch}
            onPageChange={setPage}
          />
        )}
        {subTab === 'friends' && (
          <FriendsList
            userId={props.userId}
            page={page}
            limit={limit}
            search={debouncedSearch}
            onPageChange={setPage}
          />
        )}
        {subTab === 'blocked' && (
          <BlockedList page={page} limit={limit} search={debouncedSearch} onPageChange={setPage} />
        )}
      </div>
    </SettingsSection>
  )
}

export default ConnectionsManager
