import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { HistoryAttemptFilters } from '@/components/history-attempt-filters'
import { HistoryAttemptSort } from '@/components/history-attempt-sort'
import { PracticeTypologyBadge } from '@/components/practice-typology-badge'
import {
  PromptEditorDialog,
  type PromptEditorValues,
} from '@/components/prompt-editor-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DEFAULT_HISTORY_SORT,
  type HistorySortKey,
} from '@/constants/history-sort.constants'
import { Textarea } from '@/components/ui/textarea'
import { ROUTES } from '@/constants/routes.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import {
  deleteSpeakingAttempt,
  deleteSpeakingPromptWithAttempts,
  fetchSpeakingAttempts,
  updateSpeakingAttemptNotes,
  updateSpeakingPrompt,
} from '@/services/speaking-firestore.service'
import type { SpeakingAttempt, SpeakingTask } from '@/types/speaking.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'
import {
  matchesTaskFilter,
  matchesTypologyFilter,
  type HistoryTaskFilter,
  type HistoryTypologyFilter,
} from '@/utils/history-filters.utils'
import { sortHistoryAttempts } from '@/utils/history-sort.utils'

const SPEAKING_EDITOR_TASK_OPTIONS = [
  { value: 1, label: 'Task 1' },
  { value: 2, label: 'Task 2' },
  { value: 3, label: 'Task 3' },
] as const

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

function formatResultsCount(
  filteredCount: number,
  totalCount: number,
  hasActiveFilters: boolean,
) {
  if (hasActiveFilters) {
    return `Showing ${String(filteredCount)} of ${String(totalCount)} attempt(s)`
  }
  return `${String(totalCount)} attempt(s)`
}

interface SpeakingHistoryCardProps {
  attempt: SpeakingAttempt
  onNotesSaved: (id: string, notes: string) => void
  onPromptUpdated: (
    promptId: string,
    patch: {
      task: SpeakingTask
      title: string
      body: string
      practiceTypology: SpeakingAttempt['practiceTypology']
    },
  ) => void
  onPromptDeleted: (promptId: string) => void
  onAttemptDeleted: (id: string) => void
}

function SpeakingHistoryCard({
  attempt,
  onNotesSaved,
  onPromptUpdated,
  onPromptDeleted,
  onAttemptDeleted,
}: SpeakingHistoryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(attempt.notes)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [promptEditorOpen, setPromptEditorOpen] = useState(false)
  const [deletePromptOpen, setDeletePromptOpen] = useState(false)
  const [deletingPrompt, setDeletingPrompt] = useState(false)
  const [deletePromptError, setDeletePromptError] = useState<string | null>(null)
  const [deleteAttemptOpen, setDeleteAttemptOpen] = useState(false)
  const [deletingAttempt, setDeletingAttempt] = useState(false)
  const [deleteAttemptError, setDeleteAttemptError] = useState<string | null>(null)

  function startEditing() {
    setDraft(attempt.notes)
    setSaveError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setDraft(attempt.notes)
    setSaveError(null)
    setIsEditing(false)
  }

  async function saveNotes() {
    setSaving(true)
    setSaveError(null)
    try {
      await updateSpeakingAttemptNotes(attempt.id, draft)
      onNotesSaved(attempt.id, draft)
      setIsEditing(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePrompt(values: PromptEditorValues) {
    const task = values.task as SpeakingTask
    await updateSpeakingPrompt(attempt.promptId, {
      task,
      title: values.title,
      body: values.body,
      practiceTypology: values.practiceTypology,
    })
    onPromptUpdated(attempt.promptId, {
      task,
      title: values.title,
      body: values.body,
      practiceTypology: values.practiceTypology,
    })
  }

  async function handleDeletePrompt() {
    setDeletingPrompt(true)
    setDeletePromptError(null)
    try {
      await deleteSpeakingPromptWithAttempts(attempt.promptId)
      setDeletePromptOpen(false)
      onPromptDeleted(attempt.promptId)
    } catch (e) {
      setDeletePromptError(e instanceof Error ? e.message : 'Failed to delete prompt')
    } finally {
      setDeletingPrompt(false)
    }
  }

  async function handleDeleteAttempt() {
    setDeletingAttempt(true)
    setDeleteAttemptError(null)
    try {
      await deleteSpeakingAttempt(attempt.id)
      setDeleteAttemptOpen(false)
      onAttemptDeleted(attempt.id)
    } catch (e) {
      setDeleteAttemptError(e instanceof Error ? e.message : 'Failed to delete exercise')
    } finally {
      setDeletingAttempt(false)
    }
  }

  const hasNotes = attempt.notes.trim().length > 0

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start gap-2">
          <CardTitle className="min-w-0 flex-1 text-base">
            {attempt.promptTitle}
            {' '}
            <span className="text-muted-foreground">
              · Task {String(attempt.task)}
            </span>
          </CardTitle>
          <PracticeTypologyBadge value={attempt.practiceTypology} />
        </div>
        <CardDescription>
          {formatWhen(attempt)} · Session timer{' '}
          {formatClockSeconds(Math.floor(attempt.extendedTimerMs / 1000))}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Prompt
            </h3>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer"
                onClick={() => setPromptEditorOpen(true)}
                aria-label="Edit prompt"
                title="Edit prompt"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer text-destructive hover:text-destructive"
                onClick={() => {
                  setDeletePromptError(null)
                  setDeletePromptOpen(true)
                }}
                aria-label="Delete prompt and its exercises"
                title="Delete prompt and its exercises"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {attempt.promptBody}
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Notes
            </h3>
            {!isEditing ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer"
                  onClick={startEditing}
                  aria-label={hasNotes ? 'Edit notes' : 'Add notes'}
                  title={hasNotes ? 'Edit notes' : 'Add notes'}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer text-destructive hover:text-destructive"
                  onClick={() => {
                    setDeleteAttemptError(null)
                    setDeleteAttemptOpen(true)
                  }}
                  aria-label="Delete this exercise"
                  title="Delete this exercise"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={8}
                disabled={saving}
                aria-label="Edit notes for this speaking attempt"
              />
              {saveError ? (
                <p className="text-sm text-destructive">{saveError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => void saveNotes()}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : hasNotes ? (
            <p className="whitespace-pre-wrap">{attempt.notes}</p>
          ) : (
            <p className="text-muted-foreground">No notes yet.</p>
          )}
        </section>
      </CardContent>
    </Card>

    {promptEditorOpen ? (
      <PromptEditorDialog
        open={promptEditorOpen}
        onOpenChange={setPromptEditorOpen}
        skillLabel="speaking"
        taskOptions={SPEAKING_EDITOR_TASK_OPTIONS}
        initialValues={{
          title: attempt.promptTitle,
          task: attempt.task,
          body: attempt.promptBody,
          practiceTypology: attempt.practiceTypology,
        }}
        onSave={handleSavePrompt}
      />
    ) : null}

    <ConfirmDialog
      open={deletePromptOpen}
      onOpenChange={(open) => {
        if (!open && !deletingPrompt) {
          setDeletePromptOpen(false)
          setDeletePromptError(null)
        }
      }}
      title="Delete this prompt?"
      description="This permanently deletes the prompt and every exercise linked to it. This cannot be undone."
      confirming={deletingPrompt}
      error={deletePromptError}
      onConfirm={() => {
        void handleDeletePrompt()
      }}
    />

    <ConfirmDialog
      open={deleteAttemptOpen}
      onOpenChange={(open) => {
        if (!open && !deletingAttempt) {
          setDeleteAttemptOpen(false)
          setDeleteAttemptError(null)
        }
      }}
      title="Delete this exercise?"
      description="This permanently deletes only this exercise. The prompt and its other exercises are kept."
      confirming={deletingAttempt}
      error={deleteAttemptError}
      onConfirm={() => {
        void handleDeleteAttempt()
      }}
    />
    </>
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
  const [sortKey, setSortKey] = useState<HistorySortKey>(DEFAULT_HISTORY_SORT)

  useEffect(() => {
    if (!firebaseReady) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const list = await fetchSpeakingAttempts()
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

  const filteredItems = useMemo(() => {
    const filtered = filterSpeakingAttempts(items, taskFilter, typologyFilter)
    return sortHistoryAttempts(filtered, sortKey)
  }, [items, taskFilter, typologyFilter, sortKey])

  const hasActiveFilters = taskFilter !== 'all' || typologyFilter !== 'all'

  const error = configError ?? fetchError

  function handleNotesSaved(id: string, notes: string) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, notes } : a)))
  }

  function handlePromptUpdated(
    promptId: string,
    patch: {
      task: SpeakingTask
      title: string
      body: string
      practiceTypology: SpeakingAttempt['practiceTypology']
    },
  ) {
    setItems((prev) =>
      prev.map((a) =>
        a.promptId === promptId
          ? {
              ...a,
              task: patch.task,
              promptTitle: patch.title,
              promptBody: patch.body,
            }
          : a,
      ),
    )
  }

  function handlePromptDeleted(promptId: string) {
    setItems((prev) => prev.filter((a) => a.promptId !== promptId))
  }

  function handleAttemptDeleted(id: string) {
    setItems((prev) => prev.filter((a) => a.id !== id))
  }

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
          <HistoryAttemptSort sortKey={sortKey} onSortKeyChange={setSortKey} />
        </>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <p
          className="text-sm font-medium text-foreground"
          role="status"
          aria-live="polite"
        >
          {formatResultsCount(filteredItems.length, items.length, hasActiveFilters)}
        </p>
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
          <SpeakingHistoryCard
            key={a.id}
            attempt={a}
            onNotesSaved={handleNotesSaved}
            onPromptUpdated={handlePromptUpdated}
            onPromptDeleted={handlePromptDeleted}
            onAttemptDeleted={handleAttemptDeleted}
          />
        ))}
      </div>
    </div>
  )
}
