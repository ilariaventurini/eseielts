import type { Timestamp } from 'firebase/firestore'

export const HELP_DOC_TAB_IDS = [
  'study-tips',
  'vocabulary',
  'ielts-writing-essay',
  'todo-and-notes',
  'ielts-listening',
  'ielts-reading',
  'ielts-writing',
  'ielts-speaking',
] as const

export type HelpDocTabId = (typeof HELP_DOC_TAB_IDS)[number]

export interface HelpDocRecord {
  readonly tabId: HelpDocTabId
  readonly body: string
  readonly updatedAt: Timestamp | null
}

export interface HelpDocTabDefinition {
  readonly tabId: HelpDocTabId
  readonly label: string
  readonly defaultMarkdown: string
}
