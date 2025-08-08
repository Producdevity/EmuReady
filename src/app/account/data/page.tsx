'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { Download, Shield, Info } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui'
import http from '@/rest/http'

export default function DataExportPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)

    try {
      const response = await http.get('/api/account/export', {
        responseType: 'blob',
      })

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers['content-disposition']
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'emuready-data-export.json'

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Your data has been exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <Shield className="mx-auto h-12 w-12 text-blue-600" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              Download Your Data
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sign in to download a copy of your EmuReady data
            </p>
          </div>

          <SignInButton mode="modal">
            <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Sign In to Access Your Data
            </button>
          </SignInButton>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Your data export will include:</p>
            <ul className="mt-2 text-left space-y-1">
              <li>• Profile information</li>
              <li>• Listings you&apos;ve created</li>
              <li>• Comments and votes</li>
              <li>• Notification history</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Download className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Download Your Data
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Get a copy of all your EmuReady data in JSON format
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What&apos;s included in your export:</h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="mr-2">📝</span>
                <span>
                  <strong>Profile Information:</strong> Username, email, bio, and account settings
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎮</span>
                <span>
                  <strong>Listings:</strong> All game compatibility reports you&apos;ve created
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">💬</span>
                <span>
                  <strong>Comments:</strong> Your comments on listings
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">👍</span>
                <span>
                  <strong>Votes:</strong> Your upvotes and downvotes
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📱</span>
                <span>
                  <strong>Devices:</strong> Devices you&apos;ve added to the database
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔔</span>
                <span>
                  <strong>Notifications:</strong> Your recent notification history
                </span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <span className="mr-2">
                    <LoadingSpinner size="sm" />
                  </span>
                  Preparing your data...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download My Data
                </>
              )}
            </button>
          </div>

          <div className="flex items-start space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Your data will be downloaded as a JSON file. This is a machine-readable format that
              contains all your information. You can open it with any text editor or use it to
              import your data into other services.
            </p>
          </div>
        </div>

        <div className="text-center">
          <a href="/account" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Account Settings
          </a>
        </div>
      </div>
    </div>
  )
}
