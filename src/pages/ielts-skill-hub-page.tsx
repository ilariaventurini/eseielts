import { Link, useParams } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

function skillIntro(s: IeltsSkill) {
  if (s === 'writing') {
    return 'Choose where to go: practice, review past attempts, or manage prompts.'
  }
  return 'Practice and history are coming soon for this paper. You can still open the backoffice to seed content or jump to exercises when they ship.'
}

export default function IeltsSkillHubPage() {
  const { skill: raw } = useParams()
  if (!isIeltsSkill(raw)) {
    return <NotFoundPage />
  }
  const skill = raw
  const title = skillTitle(skill)

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{skillIntro(skill)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Where next?</CardTitle>
            <CardDescription>
              Open exercises, history, or the backoffice for this paper.
            </CardDescription>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button asChild size="sm" className="cursor-pointer w-fit">
                <Link to={skillExercisesPath(skill)}>Exercises</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="cursor-pointer w-fit">
                <Link to={skillHistoryPath(skill)}>History</Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="cursor-pointer w-fit">
                <Link to={skillBackofficePath(skill)}>Backoffice</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
