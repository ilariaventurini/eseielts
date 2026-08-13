import {
  AVAILABLE_GEMINI_MODELS,
  GEMINI_RETRY_MAX_ATTEMPTS,
  GEMINI_WRITING_SOLUTION_PATH,
} from '@/constants/app.constants'
import type { GeminiWritingSolutionRequest } from '@/types/gemini.types'
import type { GeminiRequestProgress } from '@/services/gemini-feedback.service'

function solutionEndpoint() {
  const override = import.meta.env.VITE_GEMINI_WRITING_SOLUTION_URL
  if (typeof override === 'string' && override.length > 0) {
    return override
  }
  return GEMINI_WRITING_SOLUTION_PATH
}

interface RequestWritingSolutionOptions {
  readonly onProgress?: (progress: GeminiRequestProgress) => void
}

interface GeminiSolutionEnvelope {
  readonly solution: string
  readonly modelName?: string
}

interface GeminiSolutionSuccess {
  readonly solution: string
}

async function requestSingleAttempt(body: GeminiWritingSolutionRequest, modelName: string) {
  const res = await fetch(solutionEndpoint(), {
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

function parseErrorMessage(rawText: string, status: number) {
  if (status === 404) {
    return 'Solution endpoint not found (404). If you use `yarn dev` only, run `yarn dev:netlify` instead and open the URL Netlify prints (usually port 8888), or set VITE_GEMINI_WRITING_SOLUTION_URL to your function URL. On Netlify production, ensure the site is deployed on Netlify with functions enabled.'
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

export async function requestWritingSolution(
  body: GeminiWritingSolutionRequest,
  options?: RequestWritingSolutionOptions
): Promise<GeminiSolutionSuccess> {
  async function runAttempt(
    modelIndex: number,
    attempt: number,
    lastError: string | null
  ): Promise<GeminiSolutionSuccess> {
    const modelName = AVAILABLE_GEMINI_MODELS[modelIndex]
    if (modelName === undefined) {
      throw new Error(lastError ?? 'Solution request failed on all configured Gemini models.')
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
        !('solution' in envelopeUnknown) ||
        typeof (envelopeUnknown as GeminiSolutionEnvelope).solution !== 'string'
      ) {
        throw new Error('Invalid response shape from server.')
      }
      const envelope = envelopeUnknown as GeminiSolutionEnvelope
      const solution = envelope.solution.trim()
      if (solution.length === 0) {
        throw new Error('Gemini returned an empty solution.')
      }
      return { solution }
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
