import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { HistoryAttemptFilters } from '@/components/history-attempt-filters'
import { HistoryCorrectionAccordion } from '@/components/history-correction-accordion'
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
import { Textarea } from '@/components/ui/textarea'
import type { WritingBandFilter } from '@/constants/history-filters.constants'
import { ROUTES } from '@/constants/routes.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import {
  deleteWritingAttempt,
  deleteWritingPromptWithAttempts,
  fetchWritingAttempts,
  updateWritingAttemptAnswer,
  updateWritingPrompt,
} from '@/services/writing-firestore.service'
import type { WritingAttempt, WritingTask } from '@/types/writing.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'
import {
  getAttemptBandScore,
  matchesBandFilter,
  matchesTaskFilter,
  matchesTypologyFilter,
  type HistoryTaskFilter,
  type HistoryTypologyFilter,
} from '@/utils/history-filters.utils'

const WRITING_EDITOR_TASK_OPTIONS = [
  { value: 1, label: 'Task 1' },
  { value: 2, label: 'Task 2' },
] as const

const WRITING_TASK_FILTER_OPTIONS = [
  { key: 'all' as const, label: 'All tasks' },
  { key: 1 as const, label: 'Task 1' },
  { key: 2 as const, label: 'Task 2' },
] as const

function formatWhen(attempt: WritingAttempt) {
  const ts = attempt.createdAt
  if (ts == null) {
    return '—'
  }
  return ts.toDate().toLocaleString('en-GB')
}

function filterWritingAttempts(
  items: readonly WritingAttempt[],
  taskFilter: HistoryTaskFilter,
  typologyFilter: HistoryTypologyFilter,
  bandFilter: WritingBandFilter,
) {
  return items.filter(
    (a) =>
      matchesTaskFilter(a.task, taskFilter) &&
      matchesTypologyFilter(a.practiceTypology, typologyFilter) &&
      matchesBandFilter(getAttemptBandScore(a.feedback), bandFilter),
  )
}

interface WritingHistoryCardProps {
  attempt: WritingAttempt
  onAnswerSaved: (id: string, answer: string, wordCount: number) => void
  onPromptUpdated: (
    promptId: string,
    patch: {
      task: WritingTask
      title: string
      body: string
      practiceTypology: WritingAttempt['practiceTypology']
    },
  ) => void
  onPromptDeleted: (promptId: string) => void
  onAttemptDeleted: (id: string) => void
}

function WritingHistoryCard({
  attempt,
  onAnswerSaved,
  onPromptUpdated,
  onPromptDeleted,
  onAttemptDeleted,
}: WritingHistoryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(attempt.answer)
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
    setDraft(attempt.answer)
    setSaveError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setDraft(attempt.answer)
    setSaveError(null)
    setIsEditing(false)
  }

  async function saveAnswer() {
    setSaving(true)
    setSaveError(null)
    try {
      const wordCount = await updateWritingAttemptAnswer(attempt.id, draft)
      onAnswerSaved(attempt.id, draft, wordCount)
      setIsEditing(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save answer')
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePrompt(values: PromptEditorValues) {
    const task = values.task as WritingTask
    await updateWritingPrompt(attempt.promptId, {
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
      await deleteWritingPromptWithAttempts(attempt.promptId)
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
      await deleteWritingAttempt(attempt.id)
      setDeleteAttemptOpen(false)
      onAttemptDeleted(attempt.id)
    } catch (e) {
      setDeleteAttemptError(e instanceof Error ? e.message : 'Failed to delete exercise')
    } finally {
      setDeletingAttempt(false)
    }
  }

  const hasAnswer = attempt.answer.trim().length > 0

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start gap-2">
          <CardTitle className="min-w-0 flex-1 text-base">
            {attempt.promptTitle}{' '}
            <span className="text-muted-foreground">
              · Task {String(attempt.task)}
            </span>
          </CardTitle>
          <PracticeTypologyBadge value={attempt.practiceTypology} />
        </div>
        <CardDescription>
          {formatWhen(attempt)} · {String(attempt.wordCount)} words ·{' '}
          {formatClockSeconds(Math.floor(attempt.durationMs / 1000))} · band{' '}
          <span className="font-medium text-accent-highlight">
            {String(attempt.feedback?.band ?? '—')}
          </span>
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
          {attempt.promptImageUrl ? (
            <figure className="mt-1 overflow-hidden rounded-sm border bg-muted">
              <img
                src={attempt.promptImageUrl}
                alt={`${attempt.promptTitle} (Task 1 visual)`}
                className="mx-auto max-h-64 w-full object-contain sm:max-h-80"
              />
            </figure>
          ) : null}
        </section>
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Your answer
            </h3>
            {!isEditing ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer"
                  onClick={startEditing}
                  aria-label={hasAnswer ? 'Edit answer' : 'Add answer'}
                  title={hasAnswer ? 'Edit answer' : 'Add answer'}
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
                rows={12}
                disabled={saving}
                aria-label="Edit your answer for this writing attempt"
              />
              {saveError ? (
                <p className="text-sm text-destructive">{saveError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => void saveAnswer()}
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
          ) : hasAnswer ? (
            <p className="whitespace-pre-wrap">{attempt.answer}</p>
          ) : (
            <p className="text-muted-foreground">No answer yet.</p>
          )}
        </section>
        <HistoryCorrectionAccordion
          correction={attempt.feedback?.correction ?? ''}
        />
      </CardContent>
    </Card>

    {promptEditorOpen ? (
      <PromptEditorDialog
        open={promptEditorOpen}
        onOpenChange={setPromptEditorOpen}
        skillLabel="writing"
        taskOptions={WRITING_EDITOR_TASK_OPTIONS}
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

export default function WritingHistoryPage() {
  const firebaseReady = isFirebaseConfigured()
  const configError = firebaseReady ? null : 'Firebase is not configured.'

  const [items, setItems] = useState<WritingAttempt[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(firebaseReady)
  const [taskFilter, setTaskFilter] = useState<HistoryTaskFilter>('all')
  const [typologyFilter, setTypologyFilter] = useState<HistoryTypologyFilter>('all')
  const [bandFilter, setBandFilter] = useState<WritingBandFilter>('all')

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

  const filteredItems = useMemo(
    () => filterWritingAttempts(items, taskFilter, typologyFilter, bandFilter),
    [items, taskFilter, typologyFilter, bandFilter],
  )

  const hasActiveFilters =
    taskFilter !== 'all' || typologyFilter !== 'all' || bandFilter !== 'all'

  const error = configError ?? fetchError

  function handleAnswerSaved(id: string, answer: string, wordCount: number) {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, answer, wordCount } : a)),
    )
  }

  function handlePromptUpdated(
    promptId: string,
    patch: {
      task: WritingTask
      title: string
      body: string
      practiceTypology: WritingAttempt['practiceTypology']
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

      {!loading && !error && items.length > 0 ? (
        <>
          <HistoryAttemptFilters
            taskFilter={taskFilter}
            onTaskFilterChange={setTaskFilter}
            taskOptions={WRITING_TASK_FILTER_OPTIONS}
            typologyFilter={typologyFilter}
            onTypologyFilterChange={setTypologyFilter}
            bandFilter={bandFilter}
            onBandFilterChange={setBandFilter}
          />
          <p className="text-xs text-muted-foreground">
            Showing {String(filteredItems.length)} of {String(items.length)} attempt(s).
          </p>
        </>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No attempts yet. Complete a task from the Writing page.
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
                  setBandFilter('all')
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
          <WritingHistoryCard
            key={a.id}
            attempt={a}
            onAnswerSaved={handleAnswerSaved}
            onPromptUpdated={handlePromptUpdated}
            onPromptDeleted={handlePromptDeleted}
            onAttemptDeleted={handleAttemptDeleted}
          />
        ))}
      </div>
    </div>
  )
}
