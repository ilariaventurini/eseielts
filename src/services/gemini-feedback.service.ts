import {
  AVAILABLE_GEMINI_MODELS,
  GEMINI_FEEDBACK_PATH,
  GEMINI_RETRY_MAX_ATTEMPTS,
} from '@/constants/app.constants'
import { geminiFeedbackResponseSchema } from '@/schemas/gemini.schemas'
import type { GeminiFeedbackPayload } from '@/types/gemini.types'
import type { GeminiWritingFeedbackRequest } from '@/types/gemini.types'
import { extractJsonObject } from '@/utils/gemini-json.utils'

function feedbackEndpoint() {
  const override = import.meta.env.VITE_GEMINI_FEEDBACK_URL
  if (typeof override === 'string' && override.length > 0) {
    return override
  }
  return GEMINI_FEEDBACK_PATH
}

export interface GeminiRequestProgress {
  readonly modelName: string
  readonly modelIndex: number
  readonly modelCount: number
  readonly attempt: number
  readonly maxAttempts: number
}

interface RequestWritingFeedbackOptions {
  readonly onProgress?: (progress: GeminiRequestProgress) => void
}

interface GeminiEnvelope {
  readonly feedback: unknown
  readonly modelName?: string
}

interface GeminiRequestSuccess {
  readonly feedback: GeminiFeedbackPayload
  readonly rawText: string
}

async function requestSingleAttempt(
  body: GeminiWritingFeedbackRequest,
  modelName: string,
) {
  const res = await fetch(feedbackEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      modelName,
      retryMaxAttempts: 1,
    }),
  })
  const rawText = await res.text()
  return { res, rawText }
}

function parseEnvelope(rawText: string) {
  try {
    return JSON.parse(rawText) as unknown
  } catch {
    throw new Error('Server response was not valid JSON.')
  }
}

function parseFeedbackFromEnvelope(envelope: GeminiEnvelope) {
  const rawFeedback = envelope.feedback
  const feedbackPayload =
    typeof rawFeedback === 'string'
      ? (JSON.parse(extractJsonObject(rawFeedback)) as unknown)
      : rawFeedback
  return geminiFeedbackResponseSchema.parse(feedbackPayload)
}

function parseErrorMessage(rawText: string, status: number) {
  if (status === 404) {
    return 'Feedback endpoint not found (404). If you use `yarn dev` only, run `yarn dev:netlify` instead and open the URL Netlify prints (usually port 8888), or set VITE_GEMINI_FEEDBACK_URL to your function URL. On Netlify production, ensure the site is deployed on Netlify with functions enabled.'
  }
  try {
    const parsed = JSON.parse(rawText) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof parsed.error === 'string' &&
      parsed.error.length > 0
    ) {
      return parsed.error
    }
  } catch {
    // no-op: fall back to raw text
  }
  return rawText || `HTTP error ${String(status)}`
}

export async function requestWritingFeedback(
  body: GeminiWritingFeedbackRequest,
  options?: RequestWritingFeedbackOptions,
): Promise<GeminiRequestSuccess> {
  async function runAttempt(
    modelIndex: number,
    attempt: number,
    lastError: string | null,
  ): Promise<GeminiRequestSuccess> {
    const modelName = AVAILABLE_GEMINI_MODELS[modelIndex]
    if (modelName === undefined) {
      throw new Error(lastError ?? 'Feedback request failed on all configured Gemini models.')
    }

    options?.onProgress?.({
      modelName,
      modelIndex: modelIndex + 1,
      modelCount: AVAILABLE_GEMINI_MODELS.length,
      attempt,
      maxAttempts: GEMINI_RETRY_MAX_ATTEMPTS,
    })

    const { res, rawText } = await requestSingleAttempt(body, modelName)
    if (res.ok) {
      const envelopeUnknown = parseEnvelope(rawText)
      if (
        typeof envelopeUnknown !== 'object' ||
        envelopeUnknown === null ||
        !('feedback' in envelopeUnknown)
      ) {
        throw new Error('Invalid response shape from server.')
      }
      const envelope = envelopeUnknown as GeminiEnvelope
      const feedback = parseFeedbackFromEnvelope(envelope)
      return { feedback, rawText }
    }

    const message = parseErrorMessage(rawText, res.status)
    const canRetrySameModel = attempt < GEMINI_RETRY_MAX_ATTEMPTS && res.status !== 404
    if (canRetrySameModel) {
      return runAttempt(modelIndex, attempt + 1, message)
    }

    const nextModelIndex = modelIndex + 1
    if (nextModelIndex < AVAILABLE_GEMINI_MODELS.length && res.status !== 404) {
      return runAttempt(nextModelIndex, 1, message)
    }

    throw new Error(message)
  }

  return runAttempt(0, 1, null)
}
