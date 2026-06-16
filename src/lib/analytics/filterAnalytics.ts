import analytics from '@/lib/analytics'

export const filterAnalytics = {
  systems(values: string[], names: string[]) {
    if (values.length === 0) return analytics.filter.clearSystemFilter()
    analytics.filter.system(values, names)
  },
  devices(values: string[], names: string[]) {
    if (values.length === 0) return analytics.filter.clearDeviceFilter()
    analytics.filter.device(values, names)
  },
  cpus(values: string[], names: string[]) {
    if (values.length === 0) return analytics.filter.clearCpuFilter()
    analytics.filter.cpu(values, names)
  },
  gpus(values: string[], names: string[]) {
    if (values.length === 0) return analytics.filter.clearGpuFilter()
    analytics.filter.gpu(values, names)
  },
  socs(values: string[], names: string[]) {
    if (values.length === 0) return analytics.filter.clearSocFilter()
    analytics.filter.soc(values, names)
  },
  emulators(values: string[], names: string[]) {
    if (values.length === 0) return analytics.filter.clearEmulatorFilter()
    analytics.filter.emulator(values, names)
  },
  performance(values: number[], labels: string[]) {
    if (values.length === 0) return analytics.filter.performance([], [])
    analytics.filter.performance(values, labels)
  },
  clearAll() {
    analytics.filter.clearAll()
  },
}
