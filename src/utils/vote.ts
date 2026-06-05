export function getBarWidth(rate: number, voteCount: number): number {
  return rate === 0 && voteCount > 0 ? 100 : rate
}
