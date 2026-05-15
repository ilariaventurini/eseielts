import type { Timestamp } from 'firebase/firestore'
import type { PracticeTypology } from '@/types/practice-typology.types'
import type { GeminiFeedbackPayload } from '@/types/gemini.types'

export type WritingTask = 1 | 2

export interface WritingPrompt {
  readonly id: string
  readonly task: WritingTask
  readonly imageUrl: string | null
  readonly title: string
  readonly body: string
  readonly practiceTypology: PracticeTypology
  readonly createdAt: Timestamp | null
}

export interface WritingAttempt {
  readonly id: string
  readonly promptId: string
  readonly task: WritingTask
  readonly promptTitle: string
  readonly promptBody: string
  readonly promptImageUrl: string | null
  readonly answer: string
  readonly wordCount: number
  readonly durationMs: number
  readonly feedback: GeminiFeedbackPayload
  readonly rawModelText: string
  readonly practiceTypology: PracticeTypology
  readonly createdAt: Timestamp | null
}
