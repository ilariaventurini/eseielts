import { useEffect, useState } from 'react'
import { Link } from 'react-router'

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
import { fetchSpeakingAttempts } from '@/services/speaking-firestore.service'
import type { SpeakingAttempt } from '@/types/speaking.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'

function formatWhen(attempt: SpeakingAttempt) {
  const ts = attempt.createdAt
  if (ts == null) {
    return '—'
  }
  return ts.toDate().toLocaleString('en-GB')
}

export default function SpeakingHistoryPage() {
  const firebaseReady = isFirebaseConfigured()
  const configError = firebaseReady ? null : 'Firebase is not configured.'

  const [items, setItems] = useState<SpeakingAttempt[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(firebaseReady)

  useEffect(() => {
    if (!firebaseReady) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const list = await fetchSpeakingAttempts(80)
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
            Speaking history
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice sessions stored in Firestore (session timer and notes).
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link to={ROUTES.speaking}>Back to speaking</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No attempts yet. Submit a practice from the Speaking exercises page.
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {a.promptTitle}
                {' '}
                <span className="text-muted-foreground">
                  · Task {String(a.task)}
                </span>
              </CardTitle>
              <CardDescription>
                {formatWhen(a)} · Session timer{' '}
                {formatClockSeconds(Math.floor(a.extendedTimerMs / 1000))}
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
              </section>
              {a.notes.trim().length > 0 ? (
                <section>
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Notes
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap">{a.notes}</p>
                </section>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
