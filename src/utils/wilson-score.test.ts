import { describe, expect, it } from 'vitest'
import { calculateWilsonScore } from '@/utils/wilson-score'

describe('calculateWilsonScore', () => {
  describe('edge cases', () => {
    it('returns 0.5 for no votes', () => {
      expect(calculateWilsonScore(0, 0)).toBe(0.5)
    })

    it('returns high score for all upvotes', () => {
      expect(calculateWilsonScore(1, 0)).toBeCloseTo(0.95, 1)
      expect(calculateWilsonScore(2, 0)).toBeCloseTo(0.965, 2)
      expect(calculateWilsonScore(5, 0)).toBeCloseTo(0.978, 2)
      expect(calculateWilsonScore(10, 0)).toBeCloseTo(0.989, 2)
      expect(calculateWilsonScore(100, 0)).toBeCloseTo(0.995, 2)
    })

    it('returns low score for all downvotes', () => {
      expect(calculateWilsonScore(0, 1)).toBeCloseTo(0.05, 1)
      expect(calculateWilsonScore(0, 2)).toBeCloseTo(0.035, 2)
      expect(calculateWilsonScore(0, 5)).toBeCloseTo(0.022, 2)
      expect(calculateWilsonScore(0, 10)).toBeCloseTo(0.011, 2)
      expect(calculateWilsonScore(0, 100)).toBeCloseTo(0.005, 2)
    })
  })

  describe('mixed votes', () => {
    it('handles 50/50 split', () => {
      expect(calculateWilsonScore(1, 1)).toBeCloseTo(0.337, 2)
      expect(calculateWilsonScore(5, 5)).toBeCloseTo(0.446, 2)
      expect(calculateWilsonScore(50, 50)).toBeCloseTo(0.483, 2)
    })

    it('handles 75% upvotes', () => {
      expect(calculateWilsonScore(3, 1)).toBeCloseTo(0.645, 2)
      expect(calculateWilsonScore(15, 5)).toBeCloseTo(0.715, 2)
      expect(calculateWilsonScore(75, 25)).toBeCloseTo(0.735, 2)
    })

    it('handles 25% upvotes', () => {
      expect(calculateWilsonScore(1, 3)).toBeCloseTo(0.177, 2)
      expect(calculateWilsonScore(5, 15)).toBeCloseTo(0.22, 2)
      expect(calculateWilsonScore(25, 75)).toBeCloseTo(0.236, 2)
    })
  })

  describe('confidence increases with more votes', () => {
    it('shows increasing confidence for 100% success rate', () => {
      const scores = [
        calculateWilsonScore(1, 0),
        calculateWilsonScore(2, 0),
        calculateWilsonScore(5, 0),
        calculateWilsonScore(10, 0),
        calculateWilsonScore(20, 0),
        calculateWilsonScore(50, 0),
      ]

      // Each score should be higher than the previous
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1])
      }
    })

    it('shows decreasing scores for 0% success rate', () => {
      const scores = [
        calculateWilsonScore(0, 1),
        calculateWilsonScore(0, 2),
        calculateWilsonScore(0, 5),
        calculateWilsonScore(0, 10),
        calculateWilsonScore(0, 20),
        calculateWilsonScore(0, 50),
      ]

      // Each score should be lower than the previous
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1])
      }
    })
  })

  describe('sorting behavior', () => {
    it('sorts listings correctly by Wilson Score', () => {
      const listings = [
        { name: 'No votes', upvotes: 0, downvotes: 0 },
        { name: '1 upvote', upvotes: 1, downvotes: 0 },
        { name: '2 upvotes', upvotes: 2, downvotes: 0 },
        { name: '10 upvotes', upvotes: 10, downvotes: 0 },
        { name: '1 down', upvotes: 0, downvotes: 1 },
        { name: '50/50', upvotes: 5, downvotes: 5 },
        { name: '75% up', upvotes: 15, downvotes: 5 },
      ]

      const withScores = listings.map((l) => ({
        ...l,
        score: calculateWilsonScore(l.upvotes, l.downvotes),
      }))

      const sorted = [...withScores].sort((a, b) => b.score - a.score)

      // Expected order: 10 upvotes, 2 upvotes, 75% up, 1 upvote, 50/50, No votes, 1 down
      expect(sorted[0].name).toBe('10 upvotes')
      expect(sorted[1].name).toBe('2 upvotes')
      expect(sorted[2].name).toBe('1 upvote')
      expect(sorted[3].name).toBe('75% up')
      expect(sorted[sorted.length - 1].name).toBe('1 down')
    })
  })

  describe('specific requirements', () => {
    it('returns ~0.965 for 2 upvotes and 0 downvotes', () => {
      const score = calculateWilsonScore(2, 0)
      expect(score).toBeCloseTo(0.965, 2)
    })

    it('returns exactly 0.5 for no votes (neutral)', () => {
      const score = calculateWilsonScore(0, 0)
      expect(score).toBe(0.5)
    })

    it('handles large numbers of votes', () => {
      const score = calculateWilsonScore(1000, 100)
      expect(score).toBeGreaterThan(0.89)
      expect(score).toBeLessThan(0.92)
    })
  })
})
