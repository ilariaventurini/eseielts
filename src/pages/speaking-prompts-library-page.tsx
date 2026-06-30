import { Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
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
import { skillBackofficePath } from '@/constants/routes.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import {
  deleteSpeakingPromptWithAttempts,
  fetchAllSpeakingPrompts,
  updateSpeakingPrompt,
} from '@/services/speaking-firestore.service'
import type { SpeakingPrompt, SpeakingTask } from '@/types/speaking.types'

const SPEAKING_EDITOR_TASK_OPTIONS = [
  { value: 1, label: 'Task 1' },
  { value: 2, label: 'Task 2' },
  { value: 3, label: 'Task 3' },
] as const

function taskBadgeClass(task: SpeakingTask) {
  if (task === 1) {
    return 'border-accent-highlight/30 bg-muted text-accent-highlight'
  }
  return 'border-border bg-muted text-muted-foreground'
}

export default function SpeakingPromptsLibraryPage() {
  const [promptLibrary, setPromptLibrary] = useState<SpeakingPrompt[] | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryFilter, setLibraryFilter] = useState<'all' | SpeakingTask>('all')
  const [editingPrompt, setEditingPrompt] = useState<SpeakingPrompt | null>(null)
  const [deletingPrompt, setDeletingPrompt] = useState<SpeakingPrompt | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const firebaseReady = isFirebaseConfigured()

  const loadPromptLibrary = useCallback(async () => {
    if (!firebaseReady) {
      return
    }
    setLibraryLoading(true)
    setLibraryError(null)
    try {
      const list = await fetchAllSpeakingPrompts()
      setPromptLibrary(list)
    } catch (e) {
      setLibraryError(e instanceof Error ? e.message : 'Failed to load prompts')
    } finally {
      setLibraryLoading(false)
    }
  }, [firebaseReady])

  useEffect(() => {
    if (!firebaseReady) {
      return
    }
    const id = window.setTimeout(() => {
      void loadPromptLibrary()
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [firebaseReady, loadPromptLibrary])

  const filteredLibrary =
    promptLibrary === null
      ? []
      : promptLibrary.filter(
          (p) => libraryFilter === 'all' || p.task === libraryFilter,
        )

  async function handleSaveEdit(values: PromptEditorValues) {
    if (!editingPrompt) {
      return
    }
    const task = values.task as SpeakingTask
    await updateSpeakingPrompt(editingPrompt.id, {
      task,
      title: values.title,
      body: values.body,
      practiceTypology: values.practiceTypology,
    })
    setPromptLibrary((prev) =>
      prev === null
        ? prev
        : prev.map((p) =>
            p.id === editingPrompt.id
              ? {
                  ...p,
                  task,
                  title: values.title,
                  body: values.body,
                  practiceTypology: values.practiceTypology,
                }
              : p,
          ),
    )
  }

  async function handleConfirmDelete() {
    if (!deletingPrompt) {
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSpeakingPromptWithAttempts(deletingPrompt.id)
      setPromptLibrary((prev) =>
        prev === null ? prev : prev.filter((p) => p.id !== deletingPrompt.id),
      )
      setDeletingPrompt(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete prompt')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prompts library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All speaking prompts in Firestore. Filter by task or refresh. Add prompts
          in{' '}
          <Link
            to={skillBackofficePath('speaking')}
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Backoffice
          </Link>
          .
        </p>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured: set the VITE_FIREBASE_* keys in your{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> file.
        </p>
      ) : null}

      {firebaseReady ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Speaking prompts</CardTitle>
                <CardDescription>Parts 1–3: title and description only (no images).</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer inline-flex shrink-0 items-center gap-2"
                disabled={libraryLoading}
                aria-busy={libraryLoading}
                onClick={() => {
                  void loadPromptLibrary()
                }}
              >
                {libraryLoading ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4 shrink-0" aria-hidden />
                )}
                Refresh
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { key: 'all' as const, label: 'All tasks' },
                  { key: 1 as const, label: 'Task 1' },
                  { key: 2 as const, label: 'Task 2' },
                  { key: 3 as const, label: 'Task 3' },
                ] as const
              ).map(({ key, label }) => (
                <Button
                  key={String(key)}
                  type="button"
                  size="sm"
                  variant={libraryFilter === key ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setLibraryFilter(key)
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {libraryError ? (
              <p className="text-sm text-destructive">{libraryError}</p>
            ) : null}
            {libraryLoading && promptLibrary === null ? (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Loading prompts…
              </div>
            ) : null}
            {promptLibrary !== null && !libraryLoading && promptLibrary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No prompts yet. Add some in{' '}
                <Link
                  to={skillBackofficePath('speaking')}
                  className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  Backoffice
                </Link>
                .
              </p>
            ) : null}
            {promptLibrary !== null && promptLibrary.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Showing {String(filteredLibrary.length)} of{' '}
                {String(promptLibrary.length)} prompt(s).
              </p>
            ) : null}
            {promptLibrary !== null &&
            promptLibrary.length > 0 &&
            filteredLibrary.length === 0 &&
            libraryFilter !== 'all' ? (
              <p className="text-sm text-muted-foreground">No prompts for this filter.</p>
            ) : null}
            <ul className="flex max-h-[min(32rem,70vh)] flex-col gap-3 overflow-y-auto pr-1">
              {filteredLibrary.map((p) => (
                <li
                  key={p.id}
                  className="rounded-sm border border-border bg-card p-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex rounded-sm border px-2 py-0.5 text-xs font-medium',
                            taskBadgeClass(p.task),
                          )}
                        >
                          Task {String(p.task)}
                        </span>
                        <PracticeTypologyBadge value={p.practiceTypology} />
                        {p.title.trim().length > 0 ? (
                          <span className="font-medium text-foreground">{p.title}</span>
                        ) : (
                          <span className="text-muted-foreground">Untitled</span>
                        )}
                      </div>
                      <p className="break-all font-mono text-[11px] text-muted-foreground">
                        id: {p.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.createdAt !== null && typeof p.createdAt.toDate === 'function'
                          ? p.createdAt.toDate().toLocaleString()
                          : 'Date unknown'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 cursor-pointer"
                        onClick={() => {
                          setEditingPrompt(p)
                        }}
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
                          setDeleteError(null)
                          setDeletingPrompt(p)
                        }}
                        aria-label="Delete prompt"
                        title="Delete prompt"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
                    {p.body}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {editingPrompt ? (
        <PromptEditorDialog
          open={editingPrompt !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPrompt(null)
            }
          }}
          skillLabel="speaking"
          taskOptions={SPEAKING_EDITOR_TASK_OPTIONS}
          initialValues={{
            title: editingPrompt.title,
            task: editingPrompt.task,
            body: editingPrompt.body,
            practiceTypology: editingPrompt.practiceTypology,
          }}
          onSave={handleSaveEdit}
        />
      ) : null}

      <ConfirmDialog
        open={deletingPrompt !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeletingPrompt(null)
            setDeleteError(null)
          }
        }}
        title="Delete this prompt?"
        description="This permanently deletes the prompt and every practice attempt linked to it. This cannot be undone."
        confirming={deleting}
        error={deleteError}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
      />
    </div>
  )
}
