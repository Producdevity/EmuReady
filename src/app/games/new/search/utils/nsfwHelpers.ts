export function inferRatingAndNsfw(game: { rating?: string | null }): {
  isErotic: boolean
} {
  const rating = game.rating?.trim()
  let isErotic = false
  if (rating) {
    const upper = rating.toUpperCase()
    if (upper.includes('AO') || upper.includes('ADULT') || upper.includes('18')) {
      isErotic = true
    }
  }
  return { isErotic }
}
