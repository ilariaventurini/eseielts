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
import { skillBackofficePath } from '@/constants/routes.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import {
  deleteWritingPromptWithAttempts,
  fetchAllWritingPrompts,
  updateWritingPrompt,
} from '@/services/writing-firestore.service'
import type { WritingPrompt, WritingTask } from '@/types/writing.types'

const WRITING_EDITOR_TASK_OPTIONS = [
  { value: 1, label: 'Task 1' },
  { value: 2, label: 'Task 2' },
] as const

export default function WritingPromptsLibraryPage() {
  const [promptLibrary, setPromptLibrary] = useState<WritingPrompt[] | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryFilter, setLibraryFilter] = useState<'all' | WritingTask>('all')
  const [editingPrompt, setEditingPrompt] = useState<WritingPrompt | null>(null)
  const [deletingPrompt, setDeletingPrompt] = useState<WritingPrompt | null>(null)
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
      const list = await fetchAllWritingPrompts()
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
    const task = values.task as WritingTask
    await updateWritingPrompt(editingPrompt.id, {
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
      await deleteWritingPromptWithAttempts(deletingPrompt.id)
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
          All writing prompts in Firestore. Filter by task or refresh. Add or edit
          prompts in{' '}
          <Link
            to={skillBackofficePath('writing')}
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Writing prompts
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Task 1 and Task 2 entries with optional Task 1 preview image.
              </p>
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
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'all' as const, label: 'All tasks' },
                { key: 1 as const, label: 'Task 1' },
                { key: 2 as const, label: 'Task 2' },
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
                to={skillBackofficePath('writing')}
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
                          p.task === 1
                            ? 'border-accent-highlight/30 bg-muted text-accent-highlight'
                            : 'border-border bg-muted text-muted-foreground',
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
                  {p.task === 1 && p.imageUrl ? (
                    <div className="shrink-0 overflow-hidden rounded border bg-muted">
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="size-20 object-cover"
                      />
                    </div>
                  ) : null}
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
        </div>
      ) : null}

      {editingPrompt ? (
        <PromptEditorDialog
          open={editingPrompt !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPrompt(null)
            }
          }}
          skillLabel="writing"
          taskOptions={WRITING_EDITOR_TASK_OPTIONS}
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
