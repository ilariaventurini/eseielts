/** Netlify function path (override with VITE_GEMINI_FEEDBACK_URL if needed). */
export const GEMINI_FEEDBACK_PATH = '/.netlify/functions/gemini-feedback'

/** Netlify function path (override with VITE_GEMINI_WRITING_SOLUTION_URL if needed). */
export const GEMINI_WRITING_SOLUTION_PATH = '/.netlify/functions/gemini-writing-solution'

export const AVAILABLE_GEMINI_MODELS = [
  // consigliati (stabili)
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  // famiglia 3.x (spesso preview / disponibilita variabile)
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-pro-preview',
] as const

export type GeminiModelId = (typeof AVAILABLE_GEMINI_MODELS)[number]

export function isGeminiModelId(value: string): value is GeminiModelId {
  return (AVAILABLE_GEMINI_MODELS as readonly string[]).includes(value)
}

export const GEMINI_RETRY_MAX_ATTEMPTS = 4
