'use client'

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
      <div className="mb-4 h-9 w-9 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="mt-2 h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="mt-3 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-white/[0.06] dark:bg-gray-800/60">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

function UserProfilePageSkeleton() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      aria-hidden
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="flex flex-col items-center lg:col-span-1 lg:items-start">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 shadow-lg animate-pulse dark:border-gray-700 dark:bg-gray-700" />
                <div className="mt-4 w-full space-y-3 text-center lg:text-left">
                  <div className="mx-auto h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse lg:mx-0" />
                  <div className="mx-auto flex h-6 w-40 items-center justify-center gap-2 lg:mx-0">
                    <div className="h-6 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-6 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                  <div className="mx-auto h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse lg:mx-0" />
                  <div className="mx-auto flex flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
                      />
                    ))}
                  </div>
                  <div className="mx-auto h-16 w-full rounded bg-gray-100 dark:bg-gray-700 animate-pulse lg:mx-0" />
                </div>
              </div>

              <div className="flex flex-col space-y-4 lg:col-span-2">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[...Array(4)].map((_, index) => (
                    <StatSkeleton key={index} />
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 dark:border-indigo-700 dark:bg-indigo-900/40">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-200 dark:bg-indigo-700 animate-pulse" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-6 w-full rounded bg-indigo-200 dark:bg-indigo-600 animate-pulse" />
                        <div className="h-4 w-4/5 rounded bg-indigo-200 dark:bg-indigo-600 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-pink-200 bg-pink-50/80 p-5 dark:border-pink-700 dark:bg-pink-900/40">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-pink-200 dark:bg-pink-700 animate-pulse" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-6 w-full rounded bg-pink-200 dark:bg-pink-600 animate-pulse" />
                        <div className="h-4 w-4/5 rounded bg-pink-200 dark:bg-pink-600 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-6 dark:border-gray-700">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="inline-flex w-full items-center rounded-xl border border-gray-200 bg-gray-100 p-1 gap-1 xl:w-auto dark:border-gray-700 dark:bg-gray-900/60">
                  <div className="h-9 flex-1 rounded-lg bg-white shadow-sm dark:bg-gray-800 animate-pulse" />
                  <div className="h-9 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="h-9 flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <div className="h-11 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse sm:w-72" />
                  <div className="flex h-11 items-center gap-1 rounded-xl border border-gray-200 bg-white/80 px-1 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
                    <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="h-9 w-9 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfilePageSkeleton
