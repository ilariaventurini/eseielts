import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { HistoryAttemptFilters } from '@/components/history-attempt-filters'
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
import { fetchSpeakingAttempts } from '@/services/speaking-firestore.service'
import type { SpeakingAttempt } from '@/types/speaking.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'
import {
  matchesTaskFilter,
  matchesTypologyFilter,
  type HistoryTaskFilter,
  type HistoryTypologyFilter,
} from '@/utils/history-filters.utils'

const SPEAKING_TASK_FILTER_OPTIONS = [
  { key: 'all' as const, label: 'All tasks' },
  { key: 1 as const, label: 'Task 1' },
  { key: 2 as const, label: 'Task 2' },
  { key: 3 as const, label: 'Task 3' },
] as const

function formatWhen(attempt: SpeakingAttempt) {
  const ts = attempt.createdAt
  if (ts == null) {
    return '—'
  }
  return ts.toDate().toLocaleString('en-GB')
}

function filterSpeakingAttempts(
  items: readonly SpeakingAttempt[],
  taskFilter: HistoryTaskFilter,
  typologyFilter: HistoryTypologyFilter,
) {
  return items.filter(
    (a) =>
      matchesTaskFilter(a.task, taskFilter) &&
      matchesTypologyFilter(a.practiceTypology, typologyFilter),
  )
}

export default function SpeakingHistoryPage() {
  const firebaseReady = isFirebaseConfigured()
  const configError = firebaseReady ? null : 'Firebase is not configured.'

  const [items, setItems] = useState<SpeakingAttempt[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(firebaseReady)
  const [taskFilter, setTaskFilter] = useState<HistoryTaskFilter>('all')
  const [typologyFilter, setTypologyFilter] = useState<HistoryTypologyFilter>('all')

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

  const filteredItems = useMemo(
    () => filterSpeakingAttempts(items, taskFilter, typologyFilter),
    [items, taskFilter, typologyFilter],
  )

  const hasActiveFilters = taskFilter !== 'all' || typologyFilter !== 'all'

  const error = configError ?? fetchError

  return (
    <div className="flex flex-col gap-4 text-left">
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

      {!loading && !error && items.length > 0 ? (
        <>
          <HistoryAttemptFilters
            taskFilter={taskFilter}
            onTaskFilterChange={setTaskFilter}
            taskOptions={SPEAKING_TASK_FILTER_OPTIONS}
            typologyFilter={typologyFilter}
            onTypologyFilterChange={setTypologyFilter}
          />
          <p className="text-xs text-muted-foreground">
            Showing {String(filteredItems.length)} of {String(items.length)} attempt(s).
          </p>
        </>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No attempts yet. Submit a practice from the Speaking exercises page.
        </p>
      ) : null}

      {!loading && !error && items.length > 0 && filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No attempts match these filters.
          {hasActiveFilters ? (
            <>
              {' '}
              <button
                type="button"
                className="cursor-pointer font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setTaskFilter('all')
                  setTypologyFilter('all')
                }}
              >
                Clear filters
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {filteredItems.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start gap-2">
                <CardTitle className="min-w-0 flex-1 text-base">
                  {a.promptTitle}
                  {' '}
                  <span className="text-muted-foreground">
                    · Task {String(a.task)}
                  </span>
                </CardTitle>
                <PracticeTypologyBadge value={a.practiceTypology} />
              </div>
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
