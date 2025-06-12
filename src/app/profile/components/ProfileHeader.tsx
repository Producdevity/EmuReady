'use client'

import { motion } from 'framer-motion'
import { Edit, Shield, Calendar, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMonthYear } from '@/utils/date'
import { formatUserRole } from '@/utils/format'
import { type Role } from '@orm'
import { type useUser } from '@clerk/nextjs'
import { type RouterOutput } from '@/types/trpc'
import ProfileUpload from './ProfileUpload'

const roleBadgeColorMap: Record<Role | 'UNKNOWN', string> = {
  USER: 'bg-green-500/90 backdrop-blur-sm',
  AUTHOR: 'bg-blue-500/90 backdrop-blur-sm',
  ADMIN: 'bg-orange-500/90 backdrop-blur-sm',
  SUPER_ADMIN: 'bg-red-500/90 backdrop-blur-sm',
  UNKNOWN: 'bg-gray-500/90 backdrop-blur-sm',
}

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>

interface Props {
  user: ClerkUser
  profileData: RouterOutput['users']['getProfile']
  currentImage: string | null
  onImageUpload: (imageUrl: string) => void
  isEditing: boolean
  onEditToggle: () => void
}

function ProfileHeader(props: Props) {
  const userRole = props.profileData.role as Role

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />

      <div className="relative p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="flex-shrink-0">
            <ProfileUpload
              currentImage={
                props.currentImage ?? props.profileData.profileImage
              }
              onUploadSuccess={props.onImageUpload}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl lg:text-4xl font-bold text-white mb-2"
                >
                  {props.user.fullName ?? 'Anonymous User'}
                </motion.h1>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-blue-100 font-medium">
                    {props.user.primaryEmailAddress?.emailAddress}
                  </span>

                  {userRole && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-semibold shadow-lg',
                        roleBadgeColorMap[userRole] ??
                          roleBadgeColorMap.UNKNOWN,
                      )}
                    >
                      <Shield className="w-4 h-4" />
                      {formatUserRole(userRole)}
                    </motion.div>
                  )}
                </div>
              </div>

              <motion.button
                onClick={props.onEditToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200 shadow-lg backdrop-blur-sm"
              >
                <Edit className="w-4 h-4" />
                {props.isEditing ? 'Cancel' : 'Edit Profile'}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <UserIcon className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 font-medium">Profile</span>
                </div>
                <p className="text-white text-lg font-semibold">Active</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 font-medium">Joined</span>
                </div>
                <p className="text-white text-lg font-semibold">
                  {formatMonthYear(props.profileData.createdAt)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 font-medium">
                    Access Level
                  </span>
                </div>
                <p className="text-white text-lg font-semibold">
                  {userRole ? formatUserRole(userRole) : 'Standard'}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfileHeader
