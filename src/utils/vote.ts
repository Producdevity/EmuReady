/**
 * Utility functions for vote-related calculations and styling
 */

/**
 * Get the color class for the success rate bar based on the rate
 * TODO: probably move this to badgeColors.ts
 * @param rate - Success rate percentage (0-100)
 * @returns Tailwind CSS background color class
 */
export function getBarColor(rate: number): string {
  if (rate >= 95) return 'bg-green-600' // Excellent - dark green
  if (rate >= 85) return 'bg-green-500' // Very good - green
  if (rate >= 75) return 'bg-green-400' // Good - light green
  if (rate >= 65) return 'bg-lime-500' // Above average - lime
  if (rate >= 55) return 'bg-yellow-400' // Average+ - light yellow
  if (rate >= 45) return 'bg-yellow-500' // Average - yellow
  if (rate >= 35) return 'bg-orange-400' // Below average - light orange
  if (rate >= 25) return 'bg-orange-500' // Poor - orange
  if (rate >= 15) return 'bg-red-400' // Bad - light red
  if (rate >= 5) return 'bg-red-500' // Very bad - red
  return 'bg-red-600' // Terrible - dark red
}

/**
 * Calculate the width percentage for the success rate bar
 * When rate is 0 but there are votes, show full red bar (100%)
 * @param rate - Success rate percentage (0-100)
 * @param voteCount - Total number of votes
 * @returns Width percentage for the bar
 */
export function getBarWidth(rate: number, voteCount: number): number {
  return rate === 0 && voteCount > 0 ? 100 : rate
}
