export interface MyMemoryTranslationResponse {
  responseData: {
    translatedText: string
    match: number
  }
  quotaFinished: boolean
  mtLangSupported: string | null
  responseDetails: string
  responseStatus: number
  responderId: string | null
  exception_code: string | null
  matches: MyMemoryMatch[]
}

export interface MyMemoryMatch {
  id: string
  segment: string
  translation: string
  source: string
  target: string
  quality: string
  reference: string | null
  'usage-count': number
  subject: string
  'created-by': string
  'last-updated-by': string
  'create-date': string // ISO date string
  'last-update-date': string // ISO date string
  match: number
  penalty: number
}
