import { describe, it, expect } from 'vitest'
import { formatCountLabel, normalizeString, normalizeStrings, bytesToHuman } from './text'

describe('formatCountLabel', () => {
  it('should format count label correctly', () => {
    expect(formatCountLabel('field', 0)).toBe('0 fields')
    expect(formatCountLabel('Pokémon', 69)).toBe('69 Pokémons')
    expect(formatCountLabel('Report', 1)).toBe('1 Report')
  })
})

describe('normalizeString', () => {
  it('should remove accents from characters', () => {
    expect(normalizeString('Astérix')).toBe('asterix')
    expect(normalizeString('Pokémon')).toBe('pokemon')
    expect(normalizeString('CAFÉ')).toBe('cafe')
    expect(normalizeString('naïve')).toBe('naive')
    expect(normalizeString('Zoë')).toBe('zoe')
  })

  it('should convert to lowercase', () => {
    expect(normalizeString('HELLO WORLD')).toBe('hello world')
    expect(normalizeString('CamelCase')).toBe('camelcase')
    expect(normalizeString('MixedCASE')).toBe('mixedcase')
  })

  it('should handle multiple accents in a single string', () => {
    expect(normalizeString('Crème brûlée')).toBe('creme brulee')
    expect(normalizeString('Naïve café')).toBe('naive cafe')
    expect(normalizeString('Pokémon™')).toBe('pokemon™')
  })

  it('should preserve special characters and symbols', () => {
    expect(normalizeString('Astérix & Obélix')).toBe('asterix & obelix')
    expect(normalizeString('Super Mario Bros.')).toBe('super mario bros.')
    expect(normalizeString('Final Fantasy VII: Remake')).toBe('final fantasy vii: remake')
    expect(normalizeString('Grand Theft Auto V (GTA 5)')).toBe('grand theft auto v (gta 5)')
  })

  it('should handle empty strings', () => {
    expect(normalizeString('')).toBe('')
  })

  it('should handle strings without accents', () => {
    expect(normalizeString('Hello World')).toBe('hello world')
    expect(normalizeString('Super Mario Bros')).toBe('super mario bros')
  })

  it('should handle numbers and special characters', () => {
    expect(normalizeString('Pokémon #151')).toBe('pokemon #151')
    expect(normalizeString('2024 CAFÉ')).toBe('2024 cafe')
  })

  it('should handle various languages with accents', () => {
    // French
    expect(normalizeString('François')).toBe('francois')
    expect(normalizeString('résumé')).toBe('resume')

    // Spanish
    expect(normalizeString('José')).toBe('jose')
    expect(normalizeString('Señor')).toBe('senor')

    // German
    expect(normalizeString('Müller')).toBe('muller')
    expect(normalizeString('Schön')).toBe('schon')

    // Portuguese
    expect(normalizeString('João')).toBe('joao')
    expect(normalizeString('São Paulo')).toBe('sao paulo')
  })

  it('should handle real game titles with accents', () => {
    expect(normalizeString('Astérix & Obélix XXL 2')).toBe('asterix & obelix xxl 2')
    expect(normalizeString('Pokémon Scarlet')).toBe('pokemon scarlet')
    expect(normalizeString('Café International')).toBe('cafe international')
  })
})

describe('normalizeStrings', () => {
  it('should normalize an array of strings', () => {
    const input = ['Astérix', 'Obélix', 'Pokémon']
    const expected = ['asterix', 'obelix', 'pokemon']
    expect(normalizeStrings(input)).toEqual(expected)
  })

  it('should handle empty array', () => {
    expect(normalizeStrings([])).toEqual([])
  })

  it('should handle array with mixed strings', () => {
    const input = ['CAFÉ', 'naïve', 'hello world']
    const expected = ['cafe', 'naive', 'hello world']
    expect(normalizeStrings(input)).toEqual(expected)
  })
})

describe('bytesToHuman', () => {
  it('should return null for undefined or non-positive values', () => {
    expect(bytesToHuman()).toBeNull()
    expect(bytesToHuman(0)).toBeNull()
    expect(bytesToHuman(-100)).toBeNull()
  })

  it('should format bytes correctly', () => {
    expect(bytesToHuman(500)).toBe('500.0 B')
    expect(bytesToHuman(1024)).toBe('1.0 KB')
    expect(bytesToHuman(1536)).toBe('1.5 KB')
    expect(bytesToHuman(1048576)).toBe('1.0 MB')
    expect(bytesToHuman(1572864)).toBe('1.5 MB')
    expect(bytesToHuman(1073741824)).toBe('1.0 GB')
    expect(bytesToHuman(1610612736)).toBe('1.5 GB')
  })
})
