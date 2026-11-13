'use client'

import { User, Save, X, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type UserProfileData = Pick<RouterOutput['users']['getProfile'], 'name' | 'bio'>

interface Props {
  userQuery: {
    data?: UserProfileData
    isPending: boolean
    error?: unknown
  }
}

function ProfileInformation(props: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  })
  const [savedProfile, setSavedProfile] = useState<{
    data: UserProfileData
    previousQueryData: Props['userQuery']['data']
  } | null>(null)
  const profileData =
    savedProfile && savedProfile.previousQueryData === props.userQuery.data
      ? savedProfile.data
      : props.userQuery.data

  const utils = api.useUtils()

  function handleEditToggle() {
    setFormData({
      name: profileData?.name ?? '',
      bio: profileData?.bio ?? '',
    })
    setIsEditing(!isEditing)
  }

  const updateProfile = api.users.update.useMutation({
    onSuccess: async (result) => {
      setSavedProfile({
        data: result.profile,
        previousQueryData: props.userQuery.data,
      })
      try {
        await utils.users.getProfile.invalidate(undefined, undefined, { throwOnError: true })
        toast.success('Profile updated successfully!')
        setIsEditing(false)
      } catch (error) {
        console.error('Error refreshing the saved profile:', error)
        toast.warning('Profile saved, but it could not be refreshed. Your draft is still open.')
      }
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
      toast.error(`Failed to update profile: ${getErrorMessage(error)}`)
    },
  })

  const handleFormSubmit = () => {
    updateProfile.mutate(formData)
  }

  const handleFormReset = () => {
    if (profileData) {
      setFormData({
        name: profileData.name ?? '',
        bio: profileData.bio ?? '',
      })
    }
    setIsEditing(false)
  }

  if (props.userQuery.isPending) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEditToggle}
          icon={isEditing ? X : Pencil}
          className="flex items-center gap-2"
          isLoading={updateProfile.isPending}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
          {isEditing ? (
            <Input
              value={formData.name}
              onChange={(ev) => setFormData({ ...formData, name: ev.target.value })}
              placeholder="Enter your name"
              className="w-full"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">{profileData?.name || 'Not set'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          {isEditing ? (
            <Input
              as="textarea"
              rows={3}
              value={formData.bio}
              onChange={(ev) => setFormData({ ...formData, bio: ev.target.value })}
              placeholder="Tell us about yourself"
              className="w-full"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">
              {profileData?.bio || 'No bio added yet'}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button icon={Save} onClick={handleFormSubmit} isLoading={updateProfile.isPending}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleFormReset} disabled={updateProfile.isPending}>
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileInformation
