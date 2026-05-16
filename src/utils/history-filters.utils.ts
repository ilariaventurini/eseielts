import type { WritingBandFilter } from '@/constants/history-filters.constants'
import type { PracticeTypology } from '@/types/practice-typology.types'

export type HistoryTaskFilter = 'all' | number

export type HistoryTypologyFilter = 'all' | PracticeTypology

export function getAttemptBandScore(feedback: { readonly band?: number } | null | undefined) {
  const band = feedback?.band
  if (typeof band !== 'number' || !Number.isFinite(band)) {
    return null
  }
  return band
}

export function matchesBandFilter(
  band: number | null,
  filter: WritingBandFilter,
) {
  if (filter === 'all') {
    return true
  }
  if (band === null) {
    return false
  }
  return Math.abs(band - filter) < 0.26
}

export function matchesTaskFilter(task: number, filter: HistoryTaskFilter) {
  if (filter === 'all') {
    return true
  }
  return task === filter
}

export function matchesTypologyFilter(
  practiceTypology: PracticeTypology,
  filter: HistoryTypologyFilter,
) {
  if (filter === 'all') {
    return true
  }
  return practiceTypology === filter
}
