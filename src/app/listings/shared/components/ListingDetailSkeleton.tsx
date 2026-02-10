import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  variant: 'handheld' | 'pc'
}

function SpecFieldRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-5 shrink-0 rounded" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export function ListingDetailSkeleton(props: Props) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 py-4 lg:py-10 px-4 overflow-x-hidden"
    >
      <span className="sr-only">Loading...</span>
      <div className="mx-auto w-full max-w-5xl">
        {/* Back button */}
        <div className="mb-6">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Card */}
        <div className="w-full p-4 lg:p-8 shadow-2xl rounded-2xl lg:rounded-3xl border-0 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex w-full flex-col items-start gap-6 lg:gap-8 md:flex-row">
            {/* Left column */}
            <div className="flex-1 w-full md:pr-8 sm:border-r-0 md:border-r md:border-gray-200 md:dark:border-gray-700">
              {/* Game image */}
              <div className="mb-6">
                <Skeleton className="w-full aspect-video rounded-lg" />
              </div>

              {/* Title + View Game button */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>

              {/* Badges */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>

              {/* PC Specifications (PC variant only) */}
              {props.variant === 'pc' && (
                <div className="mb-6">
                  <Skeleton className="mb-3 h-6 w-36" />
                  <div className="w-full rounded-2xl border border-gray-200/70 bg-white/80 p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-800/80">
                    <div className="space-y-4">
                      <SpecFieldRowSkeleton />
                      <SpecFieldRowSkeleton />
                      <SpecFieldRowSkeleton />
                      <SpecFieldRowSkeleton />
                      <SpecFieldRowSkeleton />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <Skeleton className="mb-2 h-5 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>

              {/* Custom fields */}
              <div className="mb-6">
                <Skeleton className="mb-2 h-5 w-40" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex w-full flex-col items-center gap-4 md:w-auto md:min-w-[180px] md:items-start">
              {/* Avatar */}
              <Skeleton className="h-16 w-16 rounded-full" />
              {/* Name */}
              <Skeleton className="h-5 w-24" />
              {/* View Profile link */}
              <Skeleton className="h-4 w-16" />

              {/* Date block */}
              <div className="w-full border-t border-gray-200 pt-4 dark:border-gray-700">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>

              {/* Action buttons */}
              <div className="flex w-full flex-col gap-2">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </div>
          </div>

          {/* Voting section */}
          <div className="mb-6 mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <Skeleton className="mb-3 h-6 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Comments section */}
          <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
            <Skeleton className="mb-4 h-6 w-24" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
