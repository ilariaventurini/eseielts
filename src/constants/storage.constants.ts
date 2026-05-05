export const STORAGE_KEYS = {
  theme: 'eseielts-theme',
  writingDraftPrefix: 'eseielts-writing-draft',
} as const

export function writingDraftStorageKey(promptId: string) {
  return `${STORAGE_KEYS.writingDraftPrefix}:${promptId}`
}
