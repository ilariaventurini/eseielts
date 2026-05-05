import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Part } from '@google/generative-ai'
import type { Handler } from '@netlify/functions'
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

Be concrete and reference the user's answer. Keep modelAnswer within typical IELTS word-count expectations for the task.`
}

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

async function fetchImagePart(url: string): Promise<Part> {
  const res = await fetch(url, { redirect: 'follow' })
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

export const handler: Handler = async (event) => {
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
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
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
      const imagePart = await fetchImagePart(imageUrl)
      parts.push({
        text: 'The image below is the Task 1 visual (chart, map, diagram, or process) the learner must describe. Use it together with the printed prompt.',
      })
      parts.push(imagePart)
    }
    parts.push({ text: userContent })

    const result = await model.generateContent(parts)
    const text = result.response.text()
    const feedbackUnknown = JSON.parse(text) as unknown
    const feedback = feedbackSchema.parse(feedbackUnknown)
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ feedback, rawModelText: text }),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini error'
    return {
      statusCode: 502,
      headers: jsonHeaders,
      body: JSON.stringify({ error: message }),
    }
  }
}
