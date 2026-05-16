/** IELTS half-band values offered in writing history band filter. */
export const WRITING_BAND_FILTER_VALUES = [
  1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9,
] as const

export type WritingBandFilter = 'all' | (typeof WRITING_BAND_FILTER_VALUES)[number]

export function formatBandFilterLabel(band: WritingBandFilter) {
  if (band === 'all') {
    return 'All bands'
  }
  return String(band)
}
