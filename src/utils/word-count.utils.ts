export function countWords(text: string) {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return 0
  }
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length
}
