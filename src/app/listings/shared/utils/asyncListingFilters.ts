export function shouldUseAsyncListingFilters(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ASYNC_LISTINGS_FILTERS !== 'false'
}
