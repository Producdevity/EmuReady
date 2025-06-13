'use client'

import Image from 'next/image'
import { useState, useRef, type ChangeEvent } from 'react'
import { uploadProfileImage } from '@/rest/user'
import getErrorMessage from '@/utils/getErrorMessage'

interface Props {
  currentImage?: string | null
  onUploadSuccess?: (imageUrl: string) => void
}

function ProfileUpload(props: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayImage =
    previewUrl ?? props.currentImage ?? '/placeholder/profile.svg'

  const handleFileChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // 5MB max size
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Preview the image
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the image
    setIsUploading(true)
    setError(null)
    uploadProfileImage(file)
      .then((imageUrl) => {
        if (props.onUploadSuccess) {
          props.onUploadSuccess(imageUrl)
        }
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'An error occurred during upload'))
        setPreviewUrl(null)
        console.error('Error uploading profile image:', err)
      })
      .finally(() => {
        setIsUploading(false)
      })
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-32 h-32 mb-4 cursor-pointer rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-all"
        onClick={triggerFileInput}
      >
        <Image
          src={displayImage}
          alt="Profile"
          fill
          sizes="(max-width: 768px) 100vw, 128px"
          className="object-cover"
          unoptimized
        />
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={triggerFileInput}
        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        disabled={isUploading}
      >
        {isUploading
          ? 'Uploading...'
          : props.currentImage
            ? 'Change Profile Picture'
            : 'Upload Profile Picture'}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default ProfileUpload
