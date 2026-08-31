// Legacy alias: /api/health behaves as the readiness check.
// Prefer /api/health/live (liveness) and /api/health/ready (readiness) for new
// consumers.
export { GET } from './ready/route'
