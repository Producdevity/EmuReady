import { describe, expect, it } from 'vitest'
import { devices } from '../../prisma/seeders/devicesSeeder'
import { socs } from '../../prisma/seeders/socSeeder'

describe('device fixture integrity', () => {
  it('resolves every nonempty device SoC reference', () => {
    const socNames = new Set(socs.map((soc) => soc.name))
    expect(devices.filter((device) => device.socName && !socNames.has(device.socName))).toEqual([])
  })

  it('defines every SoC name exactly once', () => {
    const names = socs.map((soc) => soc.name)
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([])
  })

  it('defines every device brand and model exactly once', () => {
    const keys = devices.map((device) => JSON.stringify([device.brandName, device.modelName]))
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([])
  })

  it('uses consistent casing for each device brand', () => {
    const names = [...new Set(devices.map((device) => device.brandName))]
    const normalized = names.map((name) => name.toLowerCase())
    expect(normalized.filter((name, index) => normalized.indexOf(name) !== index)).toEqual([])
  })

  it('keeps the distinct OnePlus variants on their respective processor families', () => {
    const byModel = new Map(
      devices
        .filter((device) => device.brandName === 'OnePlus')
        .map((device) => [device.modelName, device.socName]),
    )
    expect(byModel.get('15R')).toBe('Snapdragon 8 Gen 5')
    expect(byModel.get('Ace 6T')).toBe('Snapdragon 8 Gen 5')
    expect(byModel.get('Ace 6')).toBe('Snapdragon 8 Elite')
  })

  it('uses the Elite processor family for both requested Galaxy flagships', () => {
    const flagships = devices.filter(
      (device) =>
        device.brandName === 'Samsung' &&
        ['Galaxy S26 Ultra', 'Galaxy Z Fold8 Ultra'].includes(device.modelName),
    )
    expect(flagships).toHaveLength(2)
    expect(flagships.every((device) => device.socName === 'Snapdragon 8 Elite Gen 5')).toBe(true)
  })
})
