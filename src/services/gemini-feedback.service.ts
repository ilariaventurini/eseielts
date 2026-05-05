import { GEMINI_FEEDBACK_PATH } from '@/constants/app.constants'
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

export async function requestWritingFeedback(
  body: GeminiWritingFeedbackRequest
): Promise<{ feedback: GeminiFeedbackPayload; rawText: string }> {
  const res = await fetch(feedbackEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const rawText = await res.text()
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Feedback endpoint not found (404). If you use `yarn dev` only, run `yarn dev:netlify` instead and open the URL Netlify prints (usually port 8888), or set VITE_GEMINI_FEEDBACK_URL to your function URL. On Netlify production, ensure the site is deployed on Netlify with functions enabled.'
      )
    }
    throw new Error(rawText || `HTTP error ${String(res.status)}`)
  }
  let envelope: unknown
  try {
    envelope = JSON.parse(rawText) as unknown
  } catch {
    throw new Error('Server response was not valid JSON.')
  }
  if (typeof envelope !== 'object' || envelope === null || !('feedback' in envelope)) {
    throw new Error('Invalid response shape from server.')
  }
  const rawFeedback = (envelope as { feedback: unknown }).feedback
  const feedbackPayload =
    typeof rawFeedback === 'string'
      ? (JSON.parse(extractJsonObject(rawFeedback)) as unknown)
      : rawFeedback
  const feedback = geminiFeedbackResponseSchema.parse(feedbackPayload)
  return { feedback, rawText }
}
