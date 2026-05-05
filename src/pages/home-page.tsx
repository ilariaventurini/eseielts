import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ROUTES } from '@/constants/routes.constants'

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          IELTS prep
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Writing practice
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Prompts from the backoffice, random task practice, timer, word count,
          Gemini feedback (B1/B2), and history on Firebase.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Backoffice</CardTitle>
            <CardDescription>
              Add one or more writing prompts (Task 1 or 2).
            </CardDescription>
            <Button asChild className="mt-4 w-fit cursor-pointer">
              <Link to={ROUTES.backoffice}>Open backoffice</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Writing</CardTitle>
            <CardDescription>
              Draw a random prompt, write, and get corrections plus a band
              score.
            </CardDescription>
            <Button asChild className="mt-4 w-fit cursor-pointer">
              <Link to={ROUTES.writing}>Start writing</Link>
            </Button>
          </CardHeader>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Sign in with Google to identify your session (optional for now).
            </CardDescription>
            <Button asChild className="mt-4 w-fit cursor-pointer">
              <Link to={ROUTES.signIn}>Go to sign in</Link>
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
