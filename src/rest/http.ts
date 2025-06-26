import axios, { type AxiosError } from 'axios'
import analytics from '@/lib/analytics'

const http = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Track errors to analytics
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
