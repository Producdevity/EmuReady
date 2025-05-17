'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import Image from 'next/image'
import { PhotoIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui'
import http from '@/rest/http'

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  className?: string
  initialImage?: string
  label?: string
}

function ImageUpload({
  onImageUploaded,
  className = '',
  initialImage = '',
  label = 'Upload Image',
}: ImageUploadProps) {
  const [image, setImage] = useState<string>(initialImage)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    try {
      setError(null)
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      const res = await http.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setImage(res.data.imageUrl)
      onImageUploaded(res.data.imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImage('')
    onImageUploaded('')
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
  }

  return (
    <div className={`${className}`}>
      {label && <label className="block mb-1 font-medium">{label}</label>}

      <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <LoadingSpinner size="md" />
            <span className="mt-2">Uploading...</span>
          </div>
        ) : image ? (
          <div className="relative">
            <Image
              src={image}
              alt="Uploaded preview"
              className="mx-auto max-h-60 max-w-full rounded-lg object-contain"
              width={0}
              height={0}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white dark:bg-gray-900 rounded-full p-1"
              aria-label="Remove image"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-40 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              Drag and drop an image here, or click to browse
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Browse Files
            </button>
          </div>
        )}

        {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
      </div>
    </div>
  )
}

export default ImageUpload
