export function countWords(text: string) {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return 0
  }
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length
}

/** Word counts per paragraph, split by blank lines (typical intro / body / conclusion blocks). */
export function paragraphWordCounts(text: string) {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => countWords(block))
}
