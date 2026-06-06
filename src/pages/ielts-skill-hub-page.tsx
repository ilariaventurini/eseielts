import { Link, useParams } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  isIeltsSkill,
  skillBackofficePath,
  skillExercisesPath,
  skillHistoryPath,
  skillPromptsLibraryPath,
  type IeltsSkill,
} from '@/constants/routes.constants'
import NotFoundPage from '@/pages/not-found-page'

function skillTitle(s: IeltsSkill) {
  if (s === 'listening') {
    return 'Listening'
  }
  if (s === 'reading') {
    return 'Reading'
  }
  if (s === 'writing') {
    return 'Writing'
  }
  return 'Speaking'
}

function skillSubtitle(s: IeltsSkill) {
  if (s === 'writing') {
    return 'Practice, history, backoffice, and prompts library for this paper.'
  }
  if (s === 'listening' || s === 'reading') {
    return 'This paper is not available yet; choose Writing or Speaking from the header or home.'
  }
  return 'Practice, history, backoffice, and prompts library are available.'
}

function isHubActionsDisabled(skill: IeltsSkill) {
  return skill === 'listening' || skill === 'reading'
}

export default function IeltsSkillHubPage() {
  const { skill: raw } = useParams()
  if (!isIeltsSkill(raw)) {
    return <NotFoundPage />
  }
  const skill = raw

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{skillTitle(skill)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{skillSubtitle(skill)}</p>
      </div>

      {isHubActionsDisabled(skill) ? (
        <div className="flex flex-col gap-3">
          <p
            className="text-sm font-medium text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            Coming soon
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button type="button" disabled className="w-full cursor-not-allowed">
              Exercises
            </Button>
            <Button type="button" disabled className="w-full cursor-not-allowed">
              History
            </Button>
            <Button type="button" disabled className="w-full cursor-not-allowed">
              Backoffice
            </Button>
            <Button type="button" disabled className="w-full cursor-not-allowed">
              Prompts library
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button asChild className="w-full cursor-pointer">
            <Link to={skillExercisesPath(skill)}>Exercises</Link>
          </Button>
          <Button asChild className="w-full cursor-pointer">
            <Link to={skillHistoryPath(skill)}>History</Link>
          </Button>
          <Button asChild className="w-full cursor-pointer">
            <Link to={skillBackofficePath(skill)}>Backoffice</Link>
          </Button>
          <Button asChild className="w-full cursor-pointer">
            <Link to={skillPromptsLibraryPath(skill)}>Prompts library</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
