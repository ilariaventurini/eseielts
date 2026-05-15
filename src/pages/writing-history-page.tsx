import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { PracticeTypologyBadge } from '@/components/practice-typology-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ROUTES } from '@/constants/routes.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import { fetchWritingAttempts } from '@/services/writing-firestore.service'
import type { WritingAttempt } from '@/types/writing.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'

function formatWhen(attempt: WritingAttempt) {
  const ts = attempt.createdAt
  if (ts == null) {
    return '—'
  }
  return ts.toDate().toLocaleString('en-GB')
}

export default function WritingHistoryPage() {
  const firebaseReady = isFirebaseConfigured()
  const configError = firebaseReady ? null : 'Firebase is not configured.'

  const [items, setItems] = useState<WritingAttempt[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(firebaseReady)

  useEffect(() => {
    if (!firebaseReady) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const list = await fetchWritingAttempts(80)
        if (!cancelled) {
          setItems(list)
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError(
            e instanceof Error ? e.message : 'Failed to load history',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [firebaseReady])

  const error = configError ?? fetchError

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Writing history
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Attempts stored in Firestore with Gemini feedback.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link to={ROUTES.writing}>Back to writing</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No attempts yet. Complete a task from the Writing page.
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start gap-2">
                <CardTitle className="min-w-0 flex-1 text-base">
                  {a.promptTitle}{' '}
                  <span className="text-muted-foreground">
                    · Task {String(a.task)}
                  </span>
                </CardTitle>
                <PracticeTypologyBadge value={a.practiceTypology} />
              </div>
              <CardDescription>
                {formatWhen(a)} · {String(a.wordCount)} words ·{' '}
                {formatClockSeconds(Math.floor(a.durationMs / 1000))} · band{' '}
                {String(a.feedback?.band ?? '—')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <section>
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Prompt
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {a.promptBody}
                </p>
                {a.promptImageUrl ? (
                  <figure className="mt-3 overflow-hidden rounded-md border bg-muted">
                    <img
                      src={a.promptImageUrl}
                      alt={`${a.promptTitle} (Task 1 visual)`}
                      className="mx-auto max-h-64 w-full object-contain sm:max-h-80"
                    />
                  </figure>
                ) : null}
              </section>
              <section>
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Your answer
                </h3>
                <p className="mt-1 whitespace-pre-wrap">{a.answer}</p>
              </section>
              <section>
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Correction
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {a.feedback?.correction ?? '—'}
                </p>
              </section>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
