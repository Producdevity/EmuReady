import { z } from 'zod'
import { HUMAN_VERIFICATION_TOKEN_MAX_LENGTH } from './constants'

export const HumanVerificationTokenSchema = z.string().max(HUMAN_VERIFICATION_TOKEN_MAX_LENGTH)
