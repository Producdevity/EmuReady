import { z } from 'zod'

export const TestResultSchema = z.object({
  checked: z.boolean(),
  notes: z.string().optional(),
})

export const TestingSessionSchema = z.object({
  testerName: z.string().default(''),
  selectedRole: z.string().default('user'),
  results: z.record(z.record(z.record(TestResultSchema))).default({}),
  expandedCategories: z.array(z.string()).default([]),
  lastSaved: z.string().optional(),
})
