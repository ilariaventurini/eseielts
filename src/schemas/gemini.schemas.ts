import { z } from 'zod'

const criteriaSchema = z.object({
  taskResponse: z.string(),
  coherence: z.string(),
  lexicalResource: z.string(),
  grammaticalRange: z.string(),
})

export const geminiFeedbackResponseSchema = z.object({
  band: z.number().min(0).max(9),
  correction: z.string(),
  modelAnswer: z.string(),
  criteria: criteriaSchema.optional(),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
})

export const geminiWritingFeedbackRequestSchema = z.object({
  task: z.union([z.literal(1), z.literal(2)]),
  promptTitle: z.string().min(1),
  promptBody: z.string().min(1),
  answer: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  targetLevel: z.string().min(1),
})
