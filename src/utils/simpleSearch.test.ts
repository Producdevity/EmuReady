import { describe, it, expect } from 'vitest'
import { searchItems, getDeviceSearchText } from './simpleSearch'

describe('simpleSearch', () => {
  describe('searchItems', () => {
    const items = [
      { id: '1', name: 'Retroid Pocket 3+' },
      { id: '2', name: 'Retroid Pocket 4' },
      { id: '3', name: 'Retroid Pocket 5' },
      { id: '4', name: 'Steam Deck OLED' },
      { id: '5', name: 'ANBERNIC RG505' },
    ]

    it('returns all items when search is empty', () => {
      expect(searchItems(items, '', (item) => item.name)).toEqual(items)
      expect(searchItems(items, '  ', (item) => item.name)).toEqual(items)
    })

    it('finds items matching single word', () => {
      const result = searchItems(items, 'Retroid', (item) => item.name)
      expect(result).toHaveLength(3)
      expect(result.map((r) => r.id)).toEqual(['1', '2', '3'])
    })

    it('finds items matching multiple words', () => {
      const result = searchItems(items, 'Retroid Pocket', (item) => item.name)
      expect(result).toHaveLength(3)
    })

    it('handles special characters correctly', () => {
      const result = searchItems(items, '3+', (item) => item.name)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('handles partial word matching', () => {
      const result = searchItems(items, 'Poc', (item) => item.name)
      expect(result).toHaveLength(3) // All "Pocket" devices
    })

    it('is case insensitive', () => {
      const result = searchItems(items, 'RETROID pocket', (item) => item.name)
      expect(result).toHaveLength(3)
    })

    it('requires all words to match', () => {
      const result = searchItems(items, 'Retroid 5', (item) => item.name)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('returns empty array when no matches', () => {
      const result = searchItems(items, 'Nintendo Switch', (item) => item.name)
      expect(result).toHaveLength(0)
    })

    it('handles the "Retroid 3+" case', () => {
      const result = searchItems(items, 'Retroid 3+', (item) => item.name)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Retroid Pocket 3+')
    })

    it('handles the "Retroid Poc" case', () => {
      const result = searchItems(items, 'Retroid Poc', (item) => item.name)
      expect(result).toHaveLength(3)
    })
  })

  describe('getDeviceSearchText', () => {
    it('combines all device fields', () => {
      const device = {
        modelName: 'Pocket 5',
        brand: { name: 'Retroid' },
        soc: { name: 'Snapdragon 865', manufacturer: 'Qualcomm' },
      }

      const text = getDeviceSearchText(device)
      expect(text).toBe('Retroid Pocket 5 Snapdragon 865 Qualcomm')
    })

    it('handles missing SoC', () => {
      const device = {
        modelName: 'Classic',
        brand: { name: 'Nintendo' },
        soc: null,
      }

      const text = getDeviceSearchText(device)
      expect(text).toBe('Nintendo Classic')
    })

    it('handles partial SoC data', () => {
      const device = {
        modelName: 'Deck',
        brand: { name: 'Steam' },
        soc: { name: 'Custom APU' },
      }

      const text = getDeviceSearchText(device)
      expect(text).toBe('Steam Deck Custom APU')
    })
  })
})
