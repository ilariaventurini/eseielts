import type { WritingTask } from '@/types/writing.types'

export const WRITING_TASK_MIN_WORDS: Record<WritingTask, number> = {
  1: 150,
  2: 250,
}

export const WRITING_TASK_TIME_MINUTES: Record<WritingTask, number> = {
  1: 20,
  2: 40,
}

export const TARGET_CEFR_LEVEL = 'B1/B2' as const
