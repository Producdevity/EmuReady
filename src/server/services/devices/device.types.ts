import type { Device, DeviceBrand, SoC, Cpu, Gpu } from '@orm'

export interface DeviceWithRelations extends Device {
  brand: DeviceBrand
  soc:
    | (SoC & {
        cpu: Cpu | null
        gpu: Gpu | null
      })
    | null
  _count: {
    listings: number
  }
}

export interface DeviceBrandWithCount extends DeviceBrand {
  _count: {
    devices: number
  }
}
