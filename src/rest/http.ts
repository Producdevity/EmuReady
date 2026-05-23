import axios, { type AxiosError } from 'axios'
import analytics from '@/lib/analytics'
import { logger } from '@/lib/logger'

const http = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    logger.error('HTTP Error:', error)
    analytics.performance.errorOccurred({
      errorType: 'api_request_error',
      errorMessage: error.message,
      page: error.config?.url || 'unknown',
      reason: `HTTP ${error.response?.status || 'Network Error'}`,
    })

    return Promise.reject(error)
  },
)

export default http
