export interface ParsedSpeakingPromptImport {
  readonly title: string
  readonly body: string
}

/**
 * Parses bulk text where each prompt is a block separated by blank lines:
 * first line = title, following lines = body (question).
 */
export function parseSpeakingPromptsImport(raw: string) {
  return raw
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
      const title = lines[0] ?? ''
      const body = lines.slice(1).join('\n').trim()
      return { title, body }
    })
    .filter((item) => item.body.length > 0)
}
