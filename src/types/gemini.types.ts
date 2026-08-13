export interface GeminiFeedbackPayload {
  readonly band: number
  readonly correction: string
  readonly modelAnswer: string
  readonly criteria?: {
    readonly taskResponse: string
    readonly coherence: string
    readonly lexicalResource: string
    readonly grammaticalRange: string
  }
  readonly strengths?: readonly string[]
  readonly improvements?: readonly string[]
}

export interface GeminiWritingFeedbackRequest {
  readonly task: 1 | 2
  readonly promptTitle: string
  readonly promptBody: string
  /** HTTPS URL to the Task 1 image; sent to Gemini as inline image when set. */
  readonly promptImageUrl?: string | null
  readonly answer: string
  readonly wordCount: number
  readonly durationMs: number
  readonly targetLevel: string
}

export interface GeminiWritingSolutionRequest {
  readonly task: 1 | 2
  readonly promptTitle: string
  readonly promptBody: string
  /** HTTPS URL to the Task 1 image; sent to Gemini as inline image when set. */
  readonly promptImageUrl?: string | null
  readonly targetLevel: string
}
