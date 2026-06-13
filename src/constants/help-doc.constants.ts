import {
  IELTS_LISTENING_TAB_MARKDOWN,
  IELTS_READING_TAB_MARKDOWN,
  IELTS_SPEAKING_TAB_MARKDOWN,
  IELTS_WRITING_ESSAY_TAB_MARKDOWN,
  IELTS_TIPS_TAB_MARKDOWN,
  IELTS_WRITING_TAB_MARKDOWN,
  VOCABULARY_TAB_MARKDOWN,
  TODO_AND_NOTES_TAB_MARKDOWN,
} from '@/constants/writing-help.markdown'
import type { HelpDocTabDefinition, HelpDocTabId } from '@/types/help-doc.types'
import { HELP_DOC_TAB_IDS } from '@/types/help-doc.types'

export const IELTS_HELP_DOC_TAB_DEFINITIONS: readonly HelpDocTabDefinition[] = [
  {
    tabId: 'study-tips',
    label: 'Study tips',
    defaultMarkdown: IELTS_TIPS_TAB_MARKDOWN,
  },
  {
    tabId: 'vocabulary',
    label: 'Vocabulary',
    defaultMarkdown: VOCABULARY_TAB_MARKDOWN,
  },
  {
    tabId: 'ielts-writing-essay',
    label: 'Essay (task 2)',
    defaultMarkdown: IELTS_WRITING_ESSAY_TAB_MARKDOWN,
  },
  {
    tabId: 'todo-and-notes',
    label: 'Todo and Notes',
    defaultMarkdown: TODO_AND_NOTES_TAB_MARKDOWN,
  },
  {
    tabId: 'ielts-listening',
    label: '1. IELTS Listening',
    defaultMarkdown: IELTS_LISTENING_TAB_MARKDOWN,
  },
  {
    tabId: 'ielts-reading',
    label: '2. IELTS Reading',
    defaultMarkdown: IELTS_READING_TAB_MARKDOWN,
  },
  {
    tabId: 'ielts-writing',
    label: '3. IELTS Writing',
    defaultMarkdown: IELTS_WRITING_TAB_MARKDOWN,
  },
  {
    tabId: 'ielts-speaking',
    label: '4. IELTS Speaking',
    defaultMarkdown: IELTS_SPEAKING_TAB_MARKDOWN,
  },
]

export function isHelpDocTabId(value: string): value is HelpDocTabId {
  return (HELP_DOC_TAB_IDS as readonly string[]).includes(value)
}

export function helpDocTabDefinition(tabId: HelpDocTabId) {
  const found = IELTS_HELP_DOC_TAB_DEFINITIONS.find((tab) => tab.tabId === tabId)
  if (found === undefined) {
    throw new Error(`Unknown help doc tab: ${tabId}`)
  }
  return found
}
