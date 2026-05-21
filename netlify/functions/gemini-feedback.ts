import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai'
import type { GenerateContentResult, Part } from '@google/generative-ai'
import type { Handler } from '@netlify/functions'
import { AVAILABLE_GEMINI_MODELS } from '../../src/constants/app.constants'
import { z } from 'zod'

const httpsImageUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://'), 'Image URL must use HTTPS')

const requestSchema = z.object({
  task: z.union([z.literal(1), z.literal(2)]),
  promptTitle: z.string().min(1),
  promptBody: z.string().min(1),
  promptImageUrl: httpsImageUrlSchema.optional().nullable(),
  answer: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  targetLevel: z.string().min(1),
  modelName: z.string().min(1).optional(),
  retryMaxAttempts: z.number().int().min(1).max(8).optional(),
})

const feedbackSchema = z.object({
  band: z.number().min(0).max(9),
  correction: z.string(),
  modelAnswer: z.string(),
  criteria: z
    .object({
      taskResponse: z.string(),
      coherence: z.string(),
      lexicalResource: z.string(),
      grammaticalRange: z.string(),
    })
    .optional(),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
})

/** Mirrors src/utils/gemini-json.utils.ts so the function bundle does not depend on ../src. */
function extractJsonObject(text: string) {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenceMatch?.[1]?.trim() ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return candidate
  }
  return candidate.slice(start, end + 1)
}

function assertGenerationNotTruncated(result: GenerateContentResult) {
  const fr = result.response.candidates?.[0]?.finishReason
  if (fr === 'MAX_TOKENS') {
    throw new Error(
      'Gemini hit the output token limit (response truncated before completion). Increase GEMINI_MAX_OUTPUT_TOKENS on the Netlify function (e.g. 8192 or 16384), redeploy, then try again.',
    )
  }
}

function parseFeedbackPayloadJson(result: GenerateContentResult, rawText: string) {
  assertGenerationNotTruncated(result)
  const candidate = extractJsonObject(rawText)
  try {
    return JSON.parse(candidate) as unknown
  } catch (firstErr) {
    try {
      return JSON.parse(rawText.trim()) as unknown
    } catch {
      const base = firstErr instanceof Error ? firstErr.message : 'Invalid JSON from model'
      const hint =
        base.includes('Unterminated') || base.includes('Unexpected end')
          ? ' This usually means the model output was cut off; raise GEMINI_MAX_OUTPUT_TOKENS and redeploy.'
          : ' Try submitting again; if it persists, switch GEMINI_MODEL (e.g. gemini-2.0-flash).'
      throw new Error(`${base}.${hint}`)
    }
  }
}

function buildInstruction(task: 1 | 2, targetLevel: string) {
  return `You are an IELTS Writing tutor. The learner targets ${targetLevel} competence but answers must be scored on the official IELTS Writing band scale (0–9, half bands allowed in your internal reasoning but output band as one number with 0.5 steps if needed — use a single number 0–9 in JSON as number).

Task type: IELTS Writing Task ${task}.
${
  task === 1
    ? 'When an image of a chart, map, diagram, or process is provided, base your feedback and model answer on that visual together with the printed prompt.'
    : ''
}

Write all free-text fields in English (correction, modelAnswer, criteria strings, strengths, improvements).

Return ONLY valid JSON matching this shape (no markdown fences):
{
  "band": number,
  "correction": string (detailed correction of the learner text),
  "modelAnswer": string (a strong model answer appropriate for ${targetLevel}, not native C2 level),
  "criteria": {
    "taskResponse": string,
    "coherence": string,
    "lexicalResource": string,
    "grammaticalRange": string
  },
  "strengths": string[],
  "improvements": string[]
}

Be concrete and reference the user's answer. Keep modelAnswer within typical IELTS word-count expectations for the task. Keep correction, modelAnswer, and criteria strings concise so the entire reply is one complete valid JSON object (no truncation mid-string).`
}

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const MIN_GEMINI_BUDGET_MS = 8000
const IMAGE_FETCH_MAX_MS = 14_000
const LAMBDA_FINISH_BUFFER_MS = 1200
const GEMINI_RETRY_DEFAULT_ATTEMPTS = 3
const GEMINI_RETRY_MIN_REMAINING_MS =
  LAMBDA_FINISH_BUFFER_MS + MIN_GEMINI_BUDGET_MS + 1200

function parseGeminiRetryMaxAttempts(override?: number): number {
  if (override !== undefined) {
    return Math.min(8, Math.max(1, override))
  }
  const raw = process.env.GEMINI_RETRY_MAX_ATTEMPTS
  if (raw === undefined || raw.trim() === '') {
    return GEMINI_RETRY_DEFAULT_ATTEMPTS
  }
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1) {
    return GEMINI_RETRY_DEFAULT_ATTEMPTS
  }
  return Math.min(8, n)
}

function selectGeminiModel(modelName: string | undefined) {
  if (modelName !== undefined && AVAILABLE_GEMINI_MODELS.includes(modelName)) {
    return modelName
  }
  return AVAILABLE_GEMINI_MODELS[0]
}

function parseGeminiMaxOutputTokens() {
  const raw = process.env.GEMINI_MAX_OUTPUT_TOKENS
  if (raw === undefined || raw.trim() === '') {
    return 8192
  }
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 1024) {
    return 8192
  }
  return Math.min(16_384, n)
}

function isRetryableGeminiError(err: unknown): boolean {
  if (err instanceof GoogleGenerativeAIFetchError) {
    return (
      err.status === 429 ||
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503
    )
  }
  if (err instanceof Error) {
    const m = err.message
    const lower = m.toLowerCase()
    return (
      m.includes('[429 ') ||
      m.includes('[500 ') ||
      m.includes('[502 ') ||
      m.includes('[503 ') ||
      lower.includes('high demand') ||
      lower.includes('service unavailable') ||
      lower.includes('resource exhausted') ||
      m.includes('UNAVAILABLE')
    )
  }
  return false
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function invokeGeminiWithRetries(
  invoke: () => Promise<GenerateContentResult>,
  maxAttempts: number,
  getRemainingMs: () => number,
): Promise<GenerateContentResult> {
  let attempt = 0
  while (attempt < maxAttempts) {
    attempt += 1
    try {
      return await invoke()
    } catch (err) {
      const attemptsLeft = attempt < maxAttempts
      const retryable = isRetryableGeminiError(err)
      const remaining = getRemainingMs()
      const backoffBase = 700 * 2 ** (attempt - 1)
      const jitter = Math.floor(Math.random() * 450)
      const backoff = Math.min(12_000, backoffBase + jitter)
      if (
        !attemptsLeft ||
        !retryable ||
        remaining <= GEMINI_RETRY_MIN_REMAINING_MS + backoff
      ) {
        throw err
      }
      await sleepMs(backoff)
    }
  }
  throw new Error('Gemini retry exhausted')
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (ms <= 0) {
    return Promise.reject(new Error(`${label}: no time left before function timeout`))
  }
  let id: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    id = setTimeout(() => {
      reject(new Error(`${label} timed out after ${String(ms)}ms`))
    }, ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (id !== undefined) {
      clearTimeout(id)
    }
  })
}

async function fetchImagePart(url: string, fetchTimeoutMs: number): Promise<Part> {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(fetchTimeoutMs),
  })
  if (!res.ok) {
    throw new Error(`Could not download image (HTTP ${String(res.status)})`)
  }
  const arrayBuffer = await res.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large (max 4 MB)')
  }
  const rawMime = res.headers.get('content-type')?.split(';')[0]?.trim()
  const mimeType =
    rawMime !== undefined &&
    rawMime.length > 0 &&
    rawMime.toLowerCase().startsWith('image/')
      ? rawMime
      : 'image/png'
  const data = Buffer.from(arrayBuffer).toString('base64')
  return { inlineData: { mimeType, data } }
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: jsonHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }),
    }
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(event.body ?? '{}') as unknown
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  const parsed = requestSchema.safeParse(parsedBody)
  if (!parsed.success) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({
        error: 'Validation failed',
        issues: parsed.error.issues,
      }),
    }
  }

  const input = parsed.data
  const modelName = selectGeminiModel(input.modelName)

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: parseGeminiMaxOutputTokens(),
    },
    systemInstruction: buildInstruction(input.task, input.targetLevel),
  })

  const userContent = `EXERCISE DATA
Prompt title: ${input.promptTitle}
Prompt text:
${input.promptBody}

LEARNER RESPONSE (${String(input.wordCount)} words, time ${String(Math.round(input.durationMs / 1000))}s):
${input.answer}`

  try {
    const imageUrl =
      typeof input.promptImageUrl === 'string' &&
      input.promptImageUrl.trim().length > 0
        ? input.promptImageUrl.trim()
        : null

    const parts: Part[] = []
    if (input.task === 1 && imageUrl !== null) {
      const remainingAfterImage = context.getRemainingTimeInMillis() - LAMBDA_FINISH_BUFFER_MS
      const imageFetchMs = Math.min(
        IMAGE_FETCH_MAX_MS,
        Math.max(3000, Math.floor(remainingAfterImage * 0.3)),
      )
      const imagePart = await fetchImagePart(imageUrl, imageFetchMs)
      parts.push({
        text: 'The image below is the Task 1 visual (chart, map, diagram, or process) the learner must describe. Use it together with the printed prompt.',
      })
      parts.push(imagePart)
    }
    parts.push({ text: userContent })

    const maxAttempts = parseGeminiRetryMaxAttempts(input.retryMaxAttempts)
    const result = await invokeGeminiWithRetries(
      () => {
        const geminiBudget = Math.max(
          MIN_GEMINI_BUDGET_MS,
          context.getRemainingTimeInMillis() - LAMBDA_FINISH_BUFFER_MS,
        )
        return withTimeout(
          model.generateContent(parts),
          geminiBudget,
          'Gemini request',
        )
      },
      maxAttempts,
      () => context.getRemainingTimeInMillis(),
    )
    const text = result.response.text()
    const feedbackUnknown = parseFeedbackPayloadJson(result, text)
    const feedback = feedbackSchema.parse(feedbackUnknown)
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ feedback, rawModelText: text, modelName }),
    }
  } catch (err) {
    let message = err instanceof Error ? err.message : 'Gemini error'
    if (err instanceof Error && err.name === 'AbortError') {
      message =
        'Downloading the Task 1 image took too long. Try again, or use a smaller or faster-hosted image URL.'
    }
    if (
      message.includes('timed out') ||
      message.includes('no time left before function timeout')
    ) {
      message = `${message} Mitigations: raise the synchronous function timeout in the Netlify UI (then redeploy) and ensure netlify.toml matches your plan; netlify dev often simulates ~30s unless you run netlify link; try GEMINI_MODEL=gemini-2.0-flash for faster responses, or GEMINI_MAX_OUTPUT_TOKENS=16384 if the model JSON was truncated.`
    }
    if (
      message.includes('[503') ||
      message.toLowerCase().includes('high demand') ||
      message.includes('[429')
    ) {
      message = `${message} The API may be temporarily overloaded; this function retries automatically up to ${String(parseGeminiRetryMaxAttempts())} time(s). Try submitting again in a minute.`
    }
    return {
      statusCode: 502,
      headers: jsonHeaders,
      body: JSON.stringify({ error: message }),
    }
  }
}
