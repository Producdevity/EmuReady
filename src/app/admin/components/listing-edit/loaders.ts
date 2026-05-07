import {
  type DeviceOption,
  type EmulatorOption,
  type GameOption,
} from '@/app/listings/components/shared'
import { type api } from '@/lib/api'

type Utils = ReturnType<typeof api.useUtils>

export function makeLoadGameItems(utils: Utils) {
  return async (query: string): Promise<GameOption[]> => {
    if (!query || query.trim().length === 0) return []
    try {
      const result = await utils.client.games.get.query({ search: query, limit: 50 })
      return result.games.map((game) => ({
        id: game.id,
        title: game.title,
        system: game.system,
        status: game.status,
      }))
    } catch (error) {
      console.error('Error loading games:', error)
      return []
    }
  }
}

export function makeLoadEmulatorItems(utils: Utils) {
  return async (query: string): Promise<EmulatorOption[]> => {
    try {
      const result = await utils.client.emulators.get.query({
        search: query || undefined,
        limit: 50,
      })
      return result.emulators.map((emulator) => ({
        id: emulator.id,
        name: emulator.name,
        systems: emulator.systems.map((system) => ({ id: system.id, name: system.name })),
      }))
    } catch (error) {
      console.error('Error loading emulators:', error)
      return []
    }
  }
}

export function makeLoadDeviceItems(utils: Utils) {
  return async (query: string): Promise<DeviceOption[]> => {
    try {
      const result = await utils.client.devices.get.query({
        search: query || undefined,
        limit: 50,
      })
      return result.devices.map((device) => ({
        id: device.id,
        brand: device.brand,
        modelName: device.modelName,
        soc: device.soc
          ? {
              id: device.soc.id,
              name: device.soc.name,
              manufacturer: device.soc.manufacturer,
            }
          : null,
      }))
    } catch (error) {
      console.error('Error loading devices:', error)
      return []
    }
  }
}

export type CpuOption = {
  id: string
  modelName: string
  brand: { id: string; name: string }
}

export function makeLoadCpuItems(utils: Utils) {
  return async (query: string): Promise<CpuOption[]> => {
    try {
      const result = await utils.client.cpus.get.query({
        search: query || undefined,
        limit: 50,
      })
      return result.cpus.map((cpu) => ({
        id: cpu.id,
        modelName: cpu.modelName,
        brand: { id: cpu.brand.id, name: cpu.brand.name },
      }))
    } catch (error) {
      console.error('Error loading CPUs:', error)
      return []
    }
  }
}

export type GpuOption = {
  id: string
  modelName: string
  brand: { id: string; name: string }
}

export function makeLoadGpuItems(utils: Utils) {
  return async (query: string): Promise<GpuOption[]> => {
    try {
      const result = await utils.client.gpus.get.query({
        search: query || undefined,
        limit: 50,
      })
      return result.gpus.map((gpu) => ({
        id: gpu.id,
        modelName: gpu.modelName,
        brand: { id: gpu.brand.id, name: gpu.brand.name },
      }))
    } catch (error) {
      console.error('Error loading GPUs:', error)
      return []
    }
  }
}
