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
    <div className="flex flex-col gap-6 text-left">
      <div>
        <p className="text-xs font-medium tracking-wide text-primary uppercase">IELTS prep</p>
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
              'group block rounded-xl text-left text-inherit no-underline outline-none',
              'motion-safe:transition-transform motion-safe:duration-200',
              'motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
            aria-label={`Open ${skillTitle(skill)} — exercises, history, backoffice, and prompts library`}
          >
            <Card
              className={cn(
                'h-full cursor-pointer border-border ring-1 ring-transparent',
                'transition-[border-color,box-shadow,background-color] duration-200',
                'group-hover:border-primary/50 group-hover:bg-accent/30',
                'group-hover:shadow-md group-hover:ring-primary/20',
                'group-active:border-primary/60 group-active:bg-accent/40'
              )}
            >
              <CardHeader>
                <CardTitle className="transition-colors duration-200 group-hover:text-primary">
                  {skillTitle(skill)}
                </CardTitle>
                <CardDescription className="transition-colors duration-200 group-hover:text-foreground/85">
                  {skillBlurb(skill)}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
