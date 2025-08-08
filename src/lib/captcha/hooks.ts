'use client'

import { useCallback } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { isCaptchaEnabled, RECAPTCHA_CONFIG } from './config'

interface UseRecaptchaResult {
  executeRecaptcha: (action: string) => Promise<string | null>
  isRecaptchaLoaded: boolean
  isCaptchaEnabled: boolean
}

export function useRecaptcha(): UseRecaptchaResult {
  const { executeRecaptcha: executeGoogleRecaptcha } = useGoogleReCaptcha()

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      if (!isCaptchaEnabled()) {
        console.warn('CAPTCHA is disabled')
        return null
      }

      if (!executeGoogleRecaptcha) {
        console.warn('reCAPTCHA not loaded yet')
        return null
      }

      try {
        return await executeGoogleRecaptcha(action)
      } catch (error) {
        console.error('Error executing reCAPTCHA:', error)
        return null
      }
    },
    [executeGoogleRecaptcha],
  )

  return {
    executeRecaptcha,
    isRecaptchaLoaded: Boolean(executeGoogleRecaptcha),
    isCaptchaEnabled: isCaptchaEnabled(),
  }
}

// Convenience hooks for specific actions
export function useRecaptchaForCreateListing() {
  const { executeRecaptcha, isRecaptchaLoaded, isCaptchaEnabled } =
    useRecaptcha()

  const executeForCreateListing = useCallback(async () => {
    return executeRecaptcha(RECAPTCHA_CONFIG.actions.CREATE_LISTING)
  }, [executeRecaptcha])

  return {
    executeForCreateListing,
    isRecaptchaLoaded,
    isCaptchaEnabled,
  }
}

export function useRecaptchaForVote() {
  const { executeRecaptcha, isRecaptchaLoaded, isCaptchaEnabled } =
    useRecaptcha()

  const executeForVote = useCallback(async () => {
    return executeRecaptcha(RECAPTCHA_CONFIG.actions.VOTE)
  }, [executeRecaptcha])

  return {
    executeForVote,
    isRecaptchaLoaded,
    isCaptchaEnabled,
  }
}

export function useRecaptchaForComment() {
  const { executeRecaptcha, isRecaptchaLoaded, isCaptchaEnabled } =
    useRecaptcha()

  const executeForComment = useCallback(async () => {
    return executeRecaptcha(RECAPTCHA_CONFIG.actions.COMMENT)
  }, [executeRecaptcha])

  return {
    executeForComment,
    isRecaptchaLoaded,
    isCaptchaEnabled,
  }
}
