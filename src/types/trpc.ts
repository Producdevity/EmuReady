import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server'
import { type AppRouter } from '@/server/api/root'

/**
 * Inference helper for outputs
 *
 * @example type AuthOutput = RouterOutput['auth']['getSession']
 */
export type RouterOutput = inferRouterOutputs<AppRouter>

/**
 * Inference helper for inputs
 *
 * @example type AuthInput = RouterInput['auth']['getSession']
 */
export type RouterInput = inferRouterInputs<AppRouter>
