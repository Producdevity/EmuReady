'use client'

import { User, Save, X, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button, Input } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

interface ProfileData {
  name: string | null
  bio: string | null
  profileImage: string | null
}

interface Props {
  userQuery: {
    data: ProfileData | null | undefined
    isLoading: boolean
    error: unknown
  }
}

function ProfileInformation(props: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  })

  const utils = api.useUtils()

  // Initialize form data when user data loads
  useEffect(() => {
    if (!props.userQuery.data) return
    setFormData({
      name: props.userQuery.data.name ?? '',
      bio: props.userQuery.data.bio ?? '',
    })
  }, [props.userQuery.data])

  const updateProfile = api.users.update.useMutation({
    onSuccess: () => {
      utils.users.getProfile.invalidate().catch(console.error)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
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
    if (props.userQuery.data) {
      setFormData({
        name: props.userQuery.data.name ?? '',
        bio: props.userQuery.data.bio ?? '',
      })
    }
    setIsEditing(false)
  }

  if (props.userQuery.isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
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
          variant="outline"
          size="sm"
          onClick={() => setIsEditing((prevState) => !prevState)}
          className="flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              Edit
            </>
          )}
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter your name"
              className="w-full"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">
              {props.userQuery.data?.name || 'Not set'}
            </p>
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
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell us about yourself"
              className="w-full"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">
              {props.userQuery.data?.bio || 'No bio added yet'}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleFormSubmit}
              isLoading={updateProfile.isPending}
              disabled={updateProfile.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={handleFormReset}
              disabled={updateProfile.isPending}
            >
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileInformation
