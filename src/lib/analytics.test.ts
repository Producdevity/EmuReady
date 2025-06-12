import { sendGAEvent } from '@next/third-parties/google'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import analytics from './analytics'

vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}))

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('filter events', () => {
    it('should send system filter event', () => {
      analytics.filter.system('Nintendo Switch')

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'system', {
        value: 'Nintendo Switch',
      })
    })

    it('should send device filter event', () => {
      analytics.filter.device('Steam Deck')

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'device', {
        value: 'Steam Deck',
      })
    })

    it('should send emulator filter event', () => {
      analytics.filter.emulator('Yuzu')

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'emulator', {
        value: 'Yuzu',
      })
    })

    it('should send performance filter event', () => {
      analytics.filter.performance('Perfect')

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'performance', {
        value: 'Perfect',
      })
    })

    it('should send search filter event', () => {
      analytics.filter.search('Mario Kart')

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'search', {
        value: 'Mario Kart',
      })
    })

    it('should handle empty string values', () => {
      analytics.filter.system('')

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'system', {
        value: '',
      })
    })

    it('should handle special characters in values', () => {
      const specialValue = 'Test & Value with "quotes" and symbols!'
      analytics.filter.search(specialValue)

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'search', {
        value: specialValue,
      })
    })
  })

  describe('event tracking', () => {
    it('should send button clicked event', () => {
      analytics.event.buttonClicked('submit-listing')

      expect(sendGAEvent).toHaveBeenCalledWith('event', 'buttonClicked', {
        value: 'submit-listing',
      })
    })

    it('should handle various button identifiers', () => {
      const buttonIds = [
        'login-button',
        'create-listing',
        'vote-up',
        'vote-down',
        'filter-clear',
      ]

      buttonIds.forEach((buttonId) => {
        analytics.event.buttonClicked(buttonId)

        expect(sendGAEvent).toHaveBeenCalledWith('event', 'buttonClicked', {
          value: buttonId,
        })
      })

      expect(sendGAEvent).toHaveBeenCalledTimes(buttonIds.length)
    })
  })

  describe('analytics object structure', () => {
    it('should have the correct structure', () => {
      expect(analytics).toHaveProperty('filter')
      expect(analytics).toHaveProperty('event')

      expect(analytics.filter).toHaveProperty('system')
      expect(analytics.filter).toHaveProperty('device')
      expect(analytics.filter).toHaveProperty('emulator')
      expect(analytics.filter).toHaveProperty('performance')
      expect(analytics.filter).toHaveProperty('search')

      expect(analytics.event).toHaveProperty('buttonClicked')
    })

    it('should have functions as values', () => {
      expect(typeof analytics.filter.system).toBe('function')
      expect(typeof analytics.filter.device).toBe('function')
      expect(typeof analytics.filter.emulator).toBe('function')
      expect(typeof analytics.filter.performance).toBe('function')
      expect(typeof analytics.filter.search).toBe('function')
      expect(typeof analytics.event.buttonClicked).toBe('function')
    })
  })

  describe('error handling', () => {
    it('should call sendGAEvent without error handling', () => {
      // The analytics functions are simple wrappers around sendGAEvent
      // They don't include error handling, which is intentional
      analytics.filter.system('test')

      expect(sendGAEvent).toHaveBeenCalledWith('filter', 'system', {
        value: 'test',
      })
    })
  })

  describe('integration scenarios', () => {
    it('should track a complete user journey', () => {
      // User searches for a game
      analytics.filter.search('Super Mario')

      // User filters by system
      analytics.filter.system('Nintendo Switch')

      // User filters by device
      analytics.filter.device('Steam Deck')

      // User clicks a button
      analytics.event.buttonClicked('create-listing')

      expect(sendGAEvent).toHaveBeenCalledTimes(4)
      expect(sendGAEvent).toHaveBeenNthCalledWith(1, 'filter', 'search', {
        value: 'Super Mario',
      })
      expect(sendGAEvent).toHaveBeenNthCalledWith(2, 'filter', 'system', {
        value: 'Nintendo Switch',
      })
      expect(sendGAEvent).toHaveBeenNthCalledWith(3, 'filter', 'device', {
        value: 'Steam Deck',
      })
      expect(sendGAEvent).toHaveBeenNthCalledWith(4, 'event', 'buttonClicked', {
        value: 'create-listing',
      })
    })
  })
})
