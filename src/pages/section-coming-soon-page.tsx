import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { skillExercisesPath } from '@/constants/routes.constants'
import type { SectionContentSkill } from '@/types/section-content.types'

interface SectionComingSoonPageProps {
  readonly skill: SectionContentSkill
  readonly variant: 'exercises' | 'history'
}

const STATIC_DOC_PATH: Record<SectionContentSkill, string> = {
  listening: '/docs/ielts-listening.md',
  reading: '/docs/ielts-reading.md',
  speaking: '/docs/ielts-speaking.md',
}

function sectionTitle(skill: SectionContentSkill) {
  if (skill === 'listening') {
    return 'Listening'
  }
  if (skill === 'reading') {
    return 'Reading'
  }
  return 'Speaking'
}

export default function SectionComingSoonPage({
  skill,
  variant,
}: SectionComingSoonPageProps) {
  const label = sectionTitle(skill)
  const heading =
    variant === 'exercises'
      ? `${label} exercises — coming soon`
      : `${label} history — coming soon`
  const description =
    variant === 'exercises'
      ? 'Interactive practice for this paper is not available yet. In the meantime you can read the static study notes or try Writing, which is fully supported.'
      : 'A timeline of your attempts for this paper will appear here once practice launches. Writing history is available today.'

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study notes</CardTitle>
          <CardDescription>
            Open the markdown reference in a new tab (hosted as a static file).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <a href={STATIC_DOC_PATH[skill]} target="_blank" rel="noreferrer">
              Open {label.toLowerCase()} guide
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm" className="cursor-pointer">
            <Link to={skillExercisesPath('writing')}>Go to writing practice</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
