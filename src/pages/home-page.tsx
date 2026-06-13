import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IELTS_SKILLS, ROUTES, skillRootPath, type IeltsSkill } from '@/constants/routes.constants'
import { cn } from '@/lib/utils'

function skillTitle(skill: IeltsSkill) {
  if (skill === 'listening') {
    return 'Listening'
  }
  if (skill === 'reading') {
    return 'Reading'
  }
  if (skill === 'writing') {
    return 'Writing'
  }
  return 'Speaking'
}

function skillBlurb(skill: IeltsSkill) {
  if (skill === 'listening') {
    return 'Exercises and history are coming soon. From the overview you can open static notes and the backoffice.'
  }
  if (skill === 'reading') {
    return 'Exercises and history are coming soon. From the overview you can open static notes and the backoffice.'
  }
  if (skill === 'writing') {
    return 'Random prompts, timer, word count, Gemini feedback, and Firestore history — all under Writing.'
  }
  return 'Exercises and history are coming soon. From the overview you can open static notes and the backoffice.'
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <p className="label-caps text-foreground">IELTS prep</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Choose a paper</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each skill card opens an overview with exercises, history, backoffice, and prompts library
          (where available). Writing is fully interactive today; the other papers ship practice over
          time while you can still seed content and read the static guides.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link to={ROUTES.helpDocsBackoffice}>Help docs backoffice</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {IELTS_SKILLS.map((skill) => (
          <Link
            key={skill}
            to={skillRootPath(skill)}
            className={cn(
              'group block rounded-sm text-left text-inherit no-underline outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
            aria-label={`Open ${skillTitle(skill)} — exercises, history, backoffice, and prompts library`}
          >
            <Card
              className={cn(
                'h-full cursor-pointer border-border',
                'transition-[border-color,background-color] duration-200',
                'group-hover:border-foreground/40'
              )}
            >
              <CardHeader>
                <CardTitle>{skillTitle(skill)}</CardTitle>
                <CardDescription>{skillBlurb(skill)}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
