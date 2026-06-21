import type { SpeakingTask } from '@/types/speaking.types'

export interface ParsedSpeakingPromptImport {
  readonly title: string
  readonly body: string
  readonly answer: string
}

function splitBlockLines(block: string) {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function parseTask1Or3Block(lines: readonly string[]): ParsedSpeakingPromptImport {
  const title = lines[0] ?? ''
  const body = lines[1] ?? ''
  const answer = lines.slice(2).join('\n').trim()
  return { title, body, answer }
}

function parseTask2Block(lines: readonly string[]): ParsedSpeakingPromptImport {
  const title = lines[0] ?? ''
  const rest = lines.slice(1)
  const lastBulletIndex = rest.reduce(
    (lastIndex, line, index) => (line.startsWith('- ') ? index : lastIndex),
    -1,
  )
  if (lastBulletIndex === -1) {
    return parseTask1Or3Block(lines)
  }
  const body = rest.slice(0, lastBulletIndex + 1).join('\n').trim()
  const answer = rest.slice(lastBulletIndex + 1).join('\n').trim()
  return { title, body, answer }
}

/**
 * Parses bulk text where each prompt is a block separated by blank lines.
 * Task 1 and 3: title line, question line, answer (remaining lines).
 * Task 2: title line, cue card with bullet list, answer after the last bullet.
 */
export function parseSpeakingPromptsImport(raw: string, task: SpeakingTask) {
  return raw
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = splitBlockLines(block)
      if (task === 2) {
        return parseTask2Block(lines)
      }
      return parseTask1Or3Block(lines)
    })
    .filter((item) => item.body.length > 0)
}
