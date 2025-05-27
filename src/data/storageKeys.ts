const PREFIX = process.env.NEXT_PUBLIC_LOCAL_STORAGE_PREFIX ?? '@EmuReady_'

const storageKeys = {
  theme: `${PREFIX}theme`,
  columnVisibility: {
    listings: `${PREFIX}listings_column_visibility`,
  },
} as const

export default storageKeys
