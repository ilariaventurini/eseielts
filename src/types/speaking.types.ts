import type { Timestamp } from 'firebase/firestore'

import type { PracticeTypology } from '@/types/practice-typology.types'

export type SpeakingTask = 1 | 2 | 3

export interface SpeakingPrompt {
  readonly id: string
  readonly task: SpeakingTask
  readonly title: string
  readonly body: string
  readonly practiceTypology: PracticeTypology
  readonly createdAt: Timestamp | null
}

export interface SpeakingAttempt {
  readonly id: string
  readonly promptId: string
  readonly task: SpeakingTask
  readonly promptTitle: string
  readonly promptBody: string
  readonly notes: string
  /** Total elapsed time on the session timer at submit (milliseconds), including an active run segment. */
  readonly extendedTimerMs: number
  readonly practiceTypology: PracticeTypology
  readonly createdAt: Timestamp | null
}
