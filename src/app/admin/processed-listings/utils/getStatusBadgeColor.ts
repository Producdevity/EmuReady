import { ListingApprovalStatus } from '@orm'

const statusColorMap: Record<ListingApprovalStatus, string> = {
  [ListingApprovalStatus.APPROVED]:
    'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
  [ListingApprovalStatus.REJECTED]:
    'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
  [ListingApprovalStatus.PENDING]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
}

const defaultStyling =
  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'

function getStatusBadgeColor(status: ListingApprovalStatus | null) {
  return status ? (statusColorMap[status] ?? defaultStyling) : defaultStyling
}

export default getStatusBadgeColor
