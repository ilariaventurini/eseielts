export const STORAGE_KEYS = {
  theme: 'eseielts-theme',
  writingDraftPrefix: 'eseielts-writing-draft',
  speakingNotesPrefix: 'eseielts-speaking-notes',
} as const

export function writingDraftStorageKey(promptId: string) {
  return `${STORAGE_KEYS.writingDraftPrefix}:${promptId}`
}

export function speakingNotesStorageKey(promptId: string) {
  return `${STORAGE_KEYS.speakingNotesPrefix}:${promptId}`
}
