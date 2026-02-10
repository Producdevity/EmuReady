'use client'

import CommunitySupportBanner from '@/components/banners/CommunitySupportBanner'
import {
  HomeAppFeatured,
  HomeCommunityMvp,
  HomeFeaturedContent,
  HomeHero,
  HomePopularEmulators,
  HomeStatistics,
  HomeTrendingDevices,
  HomeJoinTheCommunity,
} from './components'

function Home() {
  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <div className="container mx-auto px-4 pb-8">
        <HomeHero />

        <CommunitySupportBanner variant="home" page="home" />

        <HomeTrendingDevices />

        <HomeStatistics />

        <HomeCommunityMvp />

        <HomePopularEmulators />

        <HomeAppFeatured />

        <HomeFeaturedContent />

        <HomeJoinTheCommunity />
      </div>
    </div>
  )
}

export default Home
