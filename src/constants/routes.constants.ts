export const IELTS_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const

export type IeltsSkill = (typeof IELTS_SKILLS)[number]

export const ROUTE_SUB_SEGMENTS = {
  exercises: 'exercises',
  history: 'history',
  backoffice: 'backoffice',
  promptsLibrary: 'prompts-library',
} as const

export function isIeltsSkill(value: string | undefined): value is IeltsSkill {
  if (value === undefined) {
    return false
  }
  return (IELTS_SKILLS as readonly string[]).includes(value)
}

/** Skill landing (overview with links to exercises / history / backoffice). */
export function skillRootPath(skill: IeltsSkill) {
  return `/${skill}`
}

export function skillExercisesPath(skill: IeltsSkill) {
  return `/${skill}/${ROUTE_SUB_SEGMENTS.exercises}`
}

export function skillHistoryPath(skill: IeltsSkill) {
  return `/${skill}/${ROUTE_SUB_SEGMENTS.history}`
}

export function skillBackofficePath(skill: IeltsSkill) {
  return `/${skill}/${ROUTE_SUB_SEGMENTS.backoffice}`
}

export function skillPromptsLibraryPath(skill: IeltsSkill) {
  return `/${skill}/${ROUTE_SUB_SEGMENTS.promptsLibrary}`
}

/** Full paths for `<Link>` / `navigate` (leading slash). */
export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  writing: '/writing',
  writingExercises: '/writing/exercises',
  writingHistory: '/writing/history',
  writingBackoffice: '/writing/backoffice',
  listeningExercises: skillExercisesPath('listening'),
  readingExercises: skillExercisesPath('reading'),
  speaking: '/speaking',
  speakingExercises: skillExercisesPath('speaking'),
  speakingHistory: skillHistoryPath('speaking'),
} as const

export type RouteKey = keyof typeof ROUTES

/** Path segments for flat `<Route path="…">` (no leading slash). */
export const ROUTE_SEGMENTS = {
  signIn: 'sign-in',
  legacyBackoffice: 'backoffice',
} as const
