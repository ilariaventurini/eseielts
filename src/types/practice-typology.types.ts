export type PracticeTypology = 'mine' | 'ai' | 'edusogno_example'

export const PRACTICE_TYPOLOGY_DEFAULT: PracticeTypology = 'mine'

export const PRACTICE_TYPOLOGY_OPTIONS: ReadonlyArray<{
  readonly value: PracticeTypology
  readonly label: string
}> = [
  { value: 'mine', label: 'Mine' },
  { value: 'ai', label: 'AI' },
  { value: 'edusogno_example', label: 'Edusogno example' },
]

export function normalizePracticeTypology(raw: unknown): PracticeTypology {
  if (raw === 'mine' || raw === 'ai' || raw === 'edusogno_example') {
    return raw
  }
  return PRACTICE_TYPOLOGY_DEFAULT
}

export function practiceTypologyLabel(value: PracticeTypology) {
  const found = PRACTICE_TYPOLOGY_OPTIONS.find((o) => o.value === value)
  if (found !== undefined) {
    return found.label
  }
  return PRACTICE_TYPOLOGY_OPTIONS[0].label
}
