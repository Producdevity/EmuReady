'use client'

import { useCallback } from 'react'
import { getHumanVerificationRequest } from './getHumanVerificationRequest'
import { useHumanVerification } from './HumanVerificationProvider'

export function useSubmitWithHumanVerification() {
  const requestVerification = useHumanVerification()

  return useCallback(
    async <T>(submit: (humanVerificationToken?: string) => Promise<T>): Promise<T> => {
      try {
        return await submit()
      } catch (error) {
        const request = getHumanVerificationRequest(error)
        if (!request) throw error

        const token = await requestVerification({ action: request.action })
        return await submit(token)
      }
    },
    [requestVerification],
  )
}
