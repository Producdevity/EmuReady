'use client'

import { type UserResource } from '@clerk/types'
import { motion } from 'framer-motion'
import { Download, ExternalLink, Shield, Calendar, UserIcon, Award, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button, TrustLevelBadge, LocalizedDate } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type RouterOutput } from '@/types/trpc'
import { getRoleColor } from '@/utils/badge-colors'
import { formatUserRole } from '@/utils/format'
import ProfileUpload from './ProfileUpload'

function maskEmail(email: string | undefined | null): string {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`
}

interface Props {
  clerkUser: UserResource
  profileData?: RouterOutput['users']['getProfile'] | null
  currentImage?: string | null
  onImageUpload?: (imageUrl: string) => void
}

function ProfileHeader(props: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

      <div className="relative p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
          <div className="flex-shrink-0">
            {props.onImageUpload ? (
              <ProfileUpload
                currentImage={props.currentImage ?? props.profileData?.profileImage}
                onUploadSuccess={props.onImageUpload}
              />
            ) : (
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserIcon className="w-12 h-12 lg:w-16 lg:h-16 text-white/80" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="text-3xl lg:text-4xl font-bold text-white mb-2"
                >
                  {props.profileData?.name ?? props.clerkUser.fullName ?? 'Anonymous User'}
                </motion.h1>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-blue-100 font-medium">
                    {maskEmail(
                      props.clerkUser.primaryEmailAddress?.emailAddress ?? props.profileData?.email,
                    )}
                  </span>

                  {props.profileData?.role && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-semibold shadow-lg',
                        getRoleColor(props.profileData.role),
                      )}
                    >
                      <Shield className="w-4 h-4" />
                      {formatUserRole(props.profileData.role)}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {process.env.NEXT_PUBLIC_ENABLE_ANDROID_DOWNLOADS === 'true' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded
                    asChild
                    icon={Download}
                    className="bg-white/15 hover:bg-white/25 text-white shadow-lg backdrop-blur-sm"
                  >
                    <Link href="/downloads">Downloads</Link>
                  </Button>
                )}
                {props.profileData?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded
                    asChild
                    icon={ExternalLink}
                    className="bg-white/15 hover:bg-white/25 text-white shadow-lg backdrop-blur-sm"
                  >
                    <Link href={`/users/${props.profileData.id}`}>View Public Profile</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 font-medium">Contributions</span>
                </div>
                <p className="text-white text-lg font-semibold">
                  {(props.profileData?._count?.listings ?? 0).toLocaleString()}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 font-medium">Joined</span>
                </div>
                <p className="text-white text-lg font-semibold">
                  {props.profileData?.createdAt ? (
                    <LocalizedDate date={props.profileData.createdAt} format="monthYear" />
                  ) : (
                    <LocalizedDate
                      date={props.clerkUser.createdAt ?? new Date()}
                      format="monthYear"
                    />
                  )}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 font-medium">Access Level</span>
                </div>
                <p className="text-white text-lg font-semibold">
                  {props.profileData?.role ? formatUserRole(props.profileData.role) : 'Standard'}
                </p>
              </motion.div>

              {props.profileData?.trustScore !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-blue-200" />
                    <span className="text-blue-100 font-medium">Trust Level</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <TrustLevelBadge
                      trustScore={props.profileData.trustScore}
                      size="sm"
                      className="[&_.bg-gray-600]:bg-white/20 [&_.text-gray-900]:text-white"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfileHeader
