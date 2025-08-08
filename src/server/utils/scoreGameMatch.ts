/**
 * Score a game name based on how well it matches a search query.
 * @param gameName - The name of the game to score.
 * @param searchQuery - The search query to match against the game name.
 */
function scoreGameMatch(gameName: string, searchQuery: string): number {
  const normalizedGameName = gameName.toLowerCase().trim()
  const normalizedQuery = searchQuery.toLowerCase().trim()

  // Exact match gets highest score
  if (normalizedGameName === normalizedQuery) return 1000

  // Game name starts with query gets very high score
  if (normalizedGameName.startsWith(normalizedQuery)) return 900

  // Split into words for more sophisticated matching
  const queryWords = normalizedQuery.split(/\s+/).filter((word) => word.length > 0)
  const gameWords = normalizedGameName.split(/\s+/).filter((word) => word.length > 0)

  // Check if all query words are present in the game name (in any order)
  const matchingWords = queryWords.filter((queryWord) =>
    gameWords.some((gameWord) => gameWord.includes(queryWord)),
  )

  if (matchingWords.length === queryWords.length) {
    // All words match - check if they're in order
    let lastIndex = -1
    let inOrder = true

    for (const queryWord of queryWords) {
      const foundIndex = gameWords.findIndex(
        (gameWord, index) => index > lastIndex && gameWord.includes(queryWord),
      )

      if (foundIndex <= lastIndex) {
        inOrder = false
        break
      }
      lastIndex = foundIndex
    }

    return inOrder ? 800 : 750
  }

  // Partial matches - score based on percentage of matching words
  if (matchingWords.length > 0) {
    const matchRatio = matchingWords.length / queryWords.length
    return 500 + matchRatio * 200
  }

  // No significant match - return 0 to preserve original TGDB ordering
  return 0
}

export default scoreGameMatch
