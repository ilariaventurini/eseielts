export const HISTORY_SORT_OPTIONS = [
  { key: 'date-desc' as const, label: 'Newest first' },
  { key: 'date-asc' as const, label: 'Oldest first' },
  { key: 'title-asc' as const, label: 'Title A–Z' },
  { key: 'title-desc' as const, label: 'Title Z–A' },
] as const

export type HistorySortKey = (typeof HISTORY_SORT_OPTIONS)[number]['key']

export const DEFAULT_HISTORY_SORT: HistorySortKey = 'date-desc'
