import { Link, useParams } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  isIeltsSkill,
  skillBackofficePath,
  skillExercisesPath,
  skillHistoryPath,
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
    return 'Practice, history, and prompt management for this paper.'
  }
  return 'Exercises and history are coming soon; you can still use the backoffice.'
}

export default function IeltsSkillHubPage() {
  const { skill: raw } = useParams()
  if (!isIeltsSkill(raw)) {
    return <NotFoundPage />
  }
  const skill = raw

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{skillTitle(skill)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{skillSubtitle(skill)}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Button asChild className="w-full cursor-pointer">
          <Link to={skillExercisesPath(skill)}>Exercises</Link>
        </Button>
        <Button asChild className="w-full cursor-pointer">
          <Link to={skillHistoryPath(skill)}>History</Link>
        </Button>
        <Button asChild className="w-full cursor-pointer">
          <Link to={skillBackofficePath(skill)}>Backoffice</Link>
        </Button>
      </div>
    </div>
  )
}
