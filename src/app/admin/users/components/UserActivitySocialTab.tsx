'use client'

import { Users, UserPlus, UserCheck, Ban, ShieldBan, Clock } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import SocialUserRow from './SocialUserRow'
import UserActivityMiniStat from './UserActivityMiniStat'

type SocialOverview = RouterOutput['users']['getSocialOverview']

type ListSection = 'followers' | 'following' | 'friends' | 'blocked'

interface Props {
  data: SocialOverview
  userId: string
  isFetching: boolean
}

// Thresholds: 10+ amber (elevated activity), 50+ red (potential spam)
function getRateColor(value: number): string {
  if (value >= 50) return 'text-red-600 dark:text-red-400'
  if (value >= 10) return 'text-amber-600 dark:text-amber-400'
  return 'text-gray-900 dark:text-white'
}

function getRateBg(value: number): string {
  if (value >= 50) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  if (value >= 10) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
  return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
}

const RATE_INDICATORS = [
  { key: 'followsSentLast24h', label: 'Follows sent (24h)' },
  { key: 'followsSentLast7d', label: 'Follows sent (7d)' },
  { key: 'followsReceivedLast24h', label: 'Follows received (24h)' },
  { key: 'followsReceivedLast7d', label: 'Follows received (7d)' },
  { key: 'friendRequestsSentLast24h', label: 'Friend reqs (24h)' },
  { key: 'friendRequestsSentLast7d', label: 'Friend reqs (7d)' },
] as const

function UserActivitySocialTab(props: Props) {
  const [activeSection, setActiveSection] = useState<ListSection>('followers')

  const sections: { id: ListSection; label: string; count: number; icon: typeof Users }[] = [
    { id: 'followers', label: 'Followers', count: props.data.counts.followers, icon: Users },
    { id: 'following', label: 'Following', count: props.data.counts.following, icon: UserPlus },
    { id: 'friends', label: 'Friends', count: props.data.counts.friends, icon: UserCheck },
    { id: 'blocked', label: 'Blocked', count: props.data.counts.blocking, icon: Ban },
  ]

  const activeItems = getActiveItems(props.data, activeSection, props.userId)

  return (
    <div className={cn('space-y-4', props.isFetching && 'opacity-60 transition-opacity')}>
      {/* Counts Overview */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        <UserActivityMiniStat
          label="Followers"
          value={props.data.counts.followers}
          icon={<Users className="w-3.5 h-3.5 text-blue-500" />}
        />
        <UserActivityMiniStat
          label="Following"
          value={props.data.counts.following}
          icon={<UserPlus className="w-3.5 h-3.5 text-green-500" />}
        />
        <UserActivityMiniStat
          label="Friends"
          value={props.data.counts.friends}
          icon={<UserCheck className="w-3.5 h-3.5 text-purple-500" />}
        />
        <UserActivityMiniStat
          label="Blocking"
          value={props.data.counts.blocking}
          icon={<Ban className="w-3.5 h-3.5 text-red-500" />}
        />
        <UserActivityMiniStat
          label="Blocked By"
          value={props.data.counts.blockedBy}
          icon={<ShieldBan className="w-3.5 h-3.5 text-orange-500" />}
        />
      </div>

      {/* Pending Friend Requests */}
      {(props.data.counts.pendingFriendRequestsSent > 0 ||
        props.data.counts.pendingFriendRequestsReceived > 0) && (
        <div className="flex gap-3 text-xs">
          {props.data.counts.pendingFriendRequestsSent > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {props.data.counts.pendingFriendRequestsSent} pending sent
            </span>
          )}
          {props.data.counts.pendingFriendRequestsReceived > 0 && (
            <span className="text-blue-600 dark:text-blue-400">
              {props.data.counts.pendingFriendRequestsReceived} pending received
            </span>
          )}
        </div>
      )}

      {/* Rate Indicators */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Activity Rate
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {RATE_INDICATORS.map((indicator) => {
            const value = props.data.rateIndicators[indicator.key]
            return (
              <div key={indicator.key} className={cn('p-2 rounded-md border', getRateBg(value))}>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                  {indicator.label}
                </span>
                <span className={cn('text-sm font-bold', getRateColor(value))}>{value}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {section.label}
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-semibold rounded-full',
                  activeSection === section.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                )}
              >
                {section.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Section Content */}
      <div className="min-h-[100px]">
        {activeItems.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeSection === 'followers' && 'No followers'}
              {activeSection === 'following' && 'Not following anyone'}
              {activeSection === 'friends' && 'No friends'}
              {activeSection === 'blocked' && 'No blocked users'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              Showing {activeItems.length} most recent
            </p>
            {activeItems.map((item) => (
              <SocialUserRow key={item.id} user={item.user} date={item.date} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getActiveItems(
  data: SocialOverview,
  section: ListSection,
  userId: string,
): { id: string; user: SocialOverview['recentFollowers'][number]['follower']; date: Date }[] {
  switch (section) {
    case 'followers':
      return data.recentFollowers.map((item) => ({
        id: item.id,
        user: item.follower,
        date: item.createdAt,
      }))
    case 'following':
      return data.recentFollowing.map((item) => ({
        id: item.id,
        user: item.following,
        date: item.createdAt,
      }))
    case 'friends':
      return data.friends.map((friendship) => ({
        id: friendship.id,
        user: friendship.sender.id === userId ? friendship.receiver : friendship.sender,
        date: friendship.createdAt,
      }))
    case 'blocked':
      return data.blockedUsers.map((item) => ({
        id: item.id,
        user: item.receiver,
        date: item.createdAt,
      }))
  }
}

export default UserActivitySocialTab
