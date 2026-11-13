import { describe, expect, it } from 'vitest'
import { parseEdenConfigFromIni } from '@/shared/emulator-config/eden/parser'
import { CustomFieldType } from '@orm'
import { convertToEdenConfig, serializeEdenConfig } from './eden.converter'

const resolutionField = {
  id: 'resolution',
  name: 'resolution',
  label: 'Resolution',
  type: CustomFieldType.SELECT,
  isRequired: true,
}

const upstreamResolutions = [
  { value: '0.25x', setup: 0 },
  { value: '0.5x', setup: 1 },
  { value: '0.75x', setup: 2 },
  { value: '1.0x', setup: 3 },
  { value: '1.25x', setup: 4 },
  { value: '1.5x', setup: 5 },
  { value: '2.0x', setup: 6 },
  { value: '3.0x', setup: 7 },
  { value: '4.0x', setup: 8 },
  { value: '5.0x', setup: 9 },
  { value: '6.0x', setup: 10 },
  { value: '7.0x', setup: 11 },
  { value: '8.0x', setup: 12 },
]

describe('Eden resolution INI contract', () => {
  it.each(upstreamResolutions)('exports and imports $value at enum index $setup', (resolution) => {
    const config = convertToEdenConfig({
      gameId: 'game',
      listingId: 'report',
      customFieldValues: [{ customFieldDefinition: resolutionField, value: resolution.value }],
    })
    const ini = serializeEdenConfig(config)
    expect(config.Renderer?.resolution_setup?.value).toBe(resolution.setup)
    expect(ini).toMatch(new RegExp(`^resolution_setup=${resolution.setup}$`, 'm'))
    expect(parseEdenConfigFromIni(ini, [resolutionField]).values).toEqual([
      { id: resolutionField.id, value: resolution.value },
    ])
  })

  it('uses native resolution for missing fields and pixel-size labels', () => {
    for (const customFieldValues of [
      [],
      [{ customFieldDefinition: resolutionField, value: '1920x1080' }],
    ]) {
      const config = convertToEdenConfig({ gameId: 'game', listingId: 'report', customFieldValues })
      expect(config.Renderer?.resolution_setup?.value).toBe(3)
    }
  })

  it.each([11, 12])('accepts raw enum index %s without narrowing it to the old range', (setup) => {
    const config = convertToEdenConfig({
      gameId: 'game',
      listingId: 'report',
      customFieldValues: [{ customFieldDefinition: resolutionField, value: setup }],
    })
    expect(config.Renderer?.resolution_setup?.value).toBe(setup)
  })

  it('caps an overflowing multiplier at the largest supported scale', () => {
    const config = convertToEdenConfig({
      gameId: 'game',
      listingId: 'report',
      customFieldValues: [{ customFieldDefinition: resolutionField, value: `${'9'.repeat(310)}x` }],
    })
    expect(config.Renderer?.resolution_setup?.value).toBe(12)
  })
})
