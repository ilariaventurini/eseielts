import type { Timestamp } from 'firebase/firestore'

export type SpeakingTask = 1 | 2 | 3

export interface SpeakingPrompt {
  readonly id: string
  readonly task: SpeakingTask
  readonly title: string
  readonly body: string
  readonly createdAt: Timestamp | null
}
