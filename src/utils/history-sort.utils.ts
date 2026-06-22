import type { Timestamp } from 'firebase/firestore'

import type { HistorySortKey } from '@/constants/history-sort.constants'

interface HistoryAttemptSortable {
  readonly promptTitle: string
  readonly createdAt: Timestamp | null
}

function compareNaturalStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

function getCreatedAtMs(createdAt: Timestamp | null) {
  if (createdAt == null) {
    return 0
  }
  return createdAt.toMillis()
}

function compareByDate(
  a: HistoryAttemptSortable,
  b: HistoryAttemptSortable,
  direction: 'asc' | 'desc',
) {
  const diff = getCreatedAtMs(a.createdAt) - getCreatedAtMs(b.createdAt)
  return direction === 'asc' ? diff : -diff
}

function compareByTitle(
  a: HistoryAttemptSortable,
  b: HistoryAttemptSortable,
  direction: 'asc' | 'desc',
) {
  const diff = compareNaturalStrings(a.promptTitle, b.promptTitle)
  return direction === 'asc' ? diff : -diff
}

export function sortHistoryAttempts<T extends HistoryAttemptSortable>(
  items: readonly T[],
  sortKey: HistorySortKey,
) {
  return [...items].sort((a, b) => {
    switch (sortKey) {
      case 'date-desc':
        return compareByDate(a, b, 'desc')
      case 'date-asc':
        return compareByDate(a, b, 'asc')
      case 'title-asc':
        return compareByTitle(a, b, 'asc')
      case 'title-desc':
        return compareByTitle(a, b, 'desc')
      default: {
        const _exhaustive: never = sortKey
        return _exhaustive
      }
    }
  })
}
