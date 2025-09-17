'use client'

import { Users, FileText, MessageSquare, AlertTriangle, Ban } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ErrorBoundary } from '@/app/admin/components/ErrorBoundary'
import { QuickNavigation } from '@/app/admin/components/QuickNavigation/QuickNavigation'
import { ADMIN_ROUTES } from '@/app/admin/config/routes'
import { type AdminNavItem } from '@/app/admin/data'
import { api } from '@/lib/api'
import { type TimeRange } from '@/schemas/activity'
import { type Role } from '@orm'
import {
  ActivityCard,
  UserActivityItem,
  ListingActivityItem,
  ReportActivityItem,
  BanActivityItem,
  CommentActivityItem,
} from './components/ActivityCard'
import { CriticalActions } from './components/CriticalActions'
import { PlatformStats } from './components/PlatformStats'

type DashboardSection = 'users' | 'listings' | 'comments' | 'reports' | 'bans' | 'stats'

const createRefreshState = (): Record<DashboardSection, boolean> => ({
  users: false,
  listings: false,
  comments: false,
  reports: false,
  bans: false,
  stats: false,
})

interface Props {
  userRole: Role
  navItems: AdminNavItem[]
}

export function AdminDashboard(props: Props) {
  // Time range states for each section
  const [usersTimeRange, setUsersTimeRange] = useState<TimeRange>('24h')
  const [listingsTimeRange, setListingsTimeRange] = useState<TimeRange>('24h')
  const [commentsTimeRange, setCommentsTimeRange] = useState<TimeRange>('24h')
  const [reportsTimeRange, setReportsTimeRange] = useState<TimeRange>('24h')
  const [bansTimeRange, setBansTimeRange] = useState<TimeRange>('24h')
  const [statsTimeRange] = useState<TimeRange>('24h')

  const [refreshingSections, setRefreshingSections] =
    useState<Record<DashboardSection, boolean>>(createRefreshState)

  const dashboardQuery = api.activity.dashboard.useQuery(
    {
      usersTimeRange,
      listingsTimeRange,
      commentsTimeRange,
      reportsTimeRange,
      bansTimeRange,
      statsTimeRange,
    },
    {
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const showUsers = dashboardQuery.data?.permissions.canSeeUsers ?? false
  const showReports = dashboardQuery.data?.permissions.canSeeReports ?? false
  const showBans = dashboardQuery.data?.permissions.canSeeBans ?? false

  const markSectionRefreshing = useCallback((section: DashboardSection) => {
    setRefreshingSections((prev) => {
      if (prev[section]) return prev
      return { ...prev, [section]: true }
    })
  }, [])

  const handleRefresh = useCallback(
    (section: DashboardSection) => {
      markSectionRefreshing(section)
      void dashboardQuery.refetch({ throwOnError: false })
    },
    [dashboardQuery, markSectionRefreshing],
  )

  const handleTimeRangeChange = useCallback(
    (section: DashboardSection, setter: (range: TimeRange) => void) => (range: TimeRange) => {
      setter(range)
      markSectionRefreshing(section)
    },
    [markSectionRefreshing],
  )

  useEffect(() => {
    if (!dashboardQuery.isFetching) {
      setRefreshingSections(createRefreshState())
    }
  }, [dashboardQuery.isFetching])

  // Handle error state - show navigation but with error message for data
  const hasError = !!dashboardQuery.error

  return (
    <div className="space-y-6">
      {/* Quick Navigation - Collapsible */}
      <ErrorBoundary>
        <QuickNavigation items={props.navItems} title="Quick Navigation" defaultExpanded={true} />
      </ErrorBoundary>

      {/* Show error banner if API call failed */}
      {hasError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-700">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            Failed to load dashboard data
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400">
            {dashboardQuery.error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => void dashboardQuery.refetch()}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Critical Actions - Only show if there are pending items */}
      {!hasError &&
        dashboardQuery.data?.criticalActions &&
        dashboardQuery.data.criticalActions.length > 0 && (
          <ErrorBoundary>
            <CriticalActions actions={dashboardQuery.data.criticalActions} />
          </ErrorBoundary>
        )}

      {/* Activity Grid - Only show if no error */}
      {!hasError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users - MODERATOR+ */}
          {showUsers && (
            <ActivityCard
              title="Recent Users"
              icon={<Users className="h-5 w-5 text-blue-500" />}
              timeRange={usersTimeRange}
              onTimeRangeChange={handleTimeRangeChange('users', setUsersTimeRange)}
              onRefresh={() => handleRefresh('users')}
              isLoading={dashboardQuery.isLoading}
              isRefreshing={refreshingSections.users}
              viewAllHref={ADMIN_ROUTES.USERS}
            >
              <div className="space-y-2">
                {dashboardQuery.data?.recentUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No new users in this period
                  </p>
                ) : (
                  dashboardQuery.data?.recentUsers.map((user) => (
                    <UserActivityItem key={user.id} user={user} userRole={props.userRole} />
                  ))
                )}
              </div>
            </ActivityCard>
          )}

          {/* Recent Listings */}
          <ActivityCard
            title="Recent Listings"
            icon={<FileText className="h-5 w-5 text-green-500" />}
            timeRange={listingsTimeRange}
            onTimeRangeChange={handleTimeRangeChange('listings', setListingsTimeRange)}
            onRefresh={() => handleRefresh('listings')}
            isLoading={dashboardQuery.isLoading}
            isRefreshing={refreshingSections.listings}
            viewAllHref="/listings"
          >
            <div className="space-y-2">
              {dashboardQuery.data?.recentListings.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No new listings in this period
                </p>
              ) : (
                dashboardQuery.data?.recentListings.map((listing) => (
                  <ListingActivityItem key={listing.id} listing={listing} />
                ))
              )}
            </div>
          </ActivityCard>

          {/* Recent Comments */}
          <ActivityCard
            title="Recent Comments"
            icon={<MessageSquare className="h-5 w-5 text-purple-500" />}
            timeRange={commentsTimeRange}
            onTimeRangeChange={handleTimeRangeChange('comments', setCommentsTimeRange)}
            onRefresh={() => handleRefresh('comments')}
            isLoading={dashboardQuery.isLoading}
            isRefreshing={refreshingSections.comments}
          >
            <div className="space-y-2">
              {dashboardQuery.data?.recentComments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No new comments in this period
                </p>
              ) : (
                dashboardQuery.data?.recentComments.map((comment) => (
                  <CommentActivityItem key={comment.id} comment={comment} />
                ))
              )}
            </div>
          </ActivityCard>

          {/* Platform Stats */}
          {dashboardQuery.data && (
            <PlatformStats
              stats={dashboardQuery.data.platformStats}
              timeRange={statsTimeRange}
              onRefresh={() => handleRefresh('stats')}
              isLoading={dashboardQuery.isLoading}
              isRefreshing={refreshingSections.stats}
            />
          )}

          {/* Recent Reports - MODERATOR+ */}
          {showReports && (
            <ActivityCard
              title="Recent Reports"
              icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
              timeRange={reportsTimeRange}
              onTimeRangeChange={handleTimeRangeChange('reports', setReportsTimeRange)}
              onRefresh={() => handleRefresh('reports')}
              isLoading={dashboardQuery.isLoading}
              isRefreshing={refreshingSections.reports}
              viewAllHref={ADMIN_ROUTES.REPORTS}
            >
              <div className="space-y-2">
                {dashboardQuery.data?.recentReports.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No new reports in this period
                  </p>
                ) : (
                  dashboardQuery.data?.recentReports.map((report) => (
                    <ReportActivityItem key={report.id} report={report} />
                  ))
                )}
              </div>
            </ActivityCard>
          )}

          {/* Recent Bans - MODERATOR+ */}
          {showBans && (
            <ActivityCard
              title="Recent Bans"
              icon={<Ban className="h-5 w-5 text-red-500" />}
              timeRange={bansTimeRange}
              onTimeRangeChange={handleTimeRangeChange('bans', setBansTimeRange)}
              onRefresh={() => handleRefresh('bans')}
              isLoading={dashboardQuery.isLoading}
              isRefreshing={refreshingSections.bans}
              viewAllHref={ADMIN_ROUTES.USER_BANS}
            >
              <div className="space-y-2">
                {dashboardQuery.data?.recentBans.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No new bans in this period
                  </p>
                ) : (
                  dashboardQuery.data?.recentBans.map((ban) => (
                    <BanActivityItem key={ban.id} ban={ban} />
                  ))
                )}
              </div>
            </ActivityCard>
          )}
        </div>
      )}
    </div>
  )
}
