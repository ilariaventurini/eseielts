import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import {
  isFirebaseConfigured,
  isFirebaseStorageConfigured,
} from '@/lib/firebase'
import { cn } from '@/lib/utils'
import {
  createWritingPrompts,
  fetchAllWritingPrompts,
} from '@/services/writing-firestore.service'
import { uploadTask1PromptImage } from '@/services/writing-storage.service'
import type { WritingPrompt, WritingTask } from '@/types/writing.types'

interface PromptRow {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly imageUrl: string
}

function newEmptyRow(): PromptRow {
  return { id: crypto.randomUUID(), title: '', body: '', imageUrl: '' }
}

function isValidHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function BackofficePage() {
  const { user, authLoading } = useAuth()
  const [task, setTask] = useState<WritingTask>(1)
  const [rows, setRows] = useState<PromptRow[]>([newEmptyRow()])
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  )
  const [message, setMessage] = useState<string | null>(null)
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null)
  const [promptLibrary, setPromptLibrary] = useState<WritingPrompt[] | null>(
    null,
  )
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryFilter, setLibraryFilter] = useState<'all' | WritingTask>(
    'all',
  )

  const firebaseReady = isFirebaseConfigured()
  const storageReady = isFirebaseStorageConfigured()

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
      setLibraryError(
        e instanceof Error ? e.message : 'Failed to load prompts',
      )
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

  function updateRow(id: string, patch: Partial<Omit<PromptRow, 'id'>>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )
  }

  function addRow() {
    setRows((prev) => [...prev, newEmptyRow()])
  }

  function removeRow(id: string) {
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((row) => row.id !== id),
    )
  }

  async function handleTask1FileSelected(rowId: string, file: File | undefined) {
    if (!file || !user) {
      return
    }
    setMessage(null)
    setUploadingRowId(rowId)
    try {
      const url = await uploadTask1PromptImage(user.uid, file)
      updateRow(rowId, { imageUrl: url })
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploadingRowId(null)
    }
  }

  async function handleSubmit() {
    setMessage(null)
    if (!firebaseReady) {
      setStatus('error')
      setMessage('Set the VITE_FIREBASE_* variables in your .env file.')
      return
    }
    const payload = rows
      .map((row) => ({
        task,
        title: row.title.trim(),
        body: row.body.trim(),
        imageUrl: task === 1 ? row.imageUrl.trim() : null,
      }))
      .filter((row) => row.body.length > 0)
    if (payload.length === 0) {
      setStatus('error')
      setMessage('Add at least one prompt body (required field).')
      return
    }
    const task1ImageInvalid =
      task === 1 &&
      payload.some(
        (row) =>
          row.imageUrl === null ||
          row.imageUrl.length === 0 ||
          !isValidHttpsUrl(row.imageUrl),
      )
    if (task1ImageInvalid) {
      setStatus('error')
      setMessage(
        'Task 1 requires a valid HTTPS image URL for each prompt (e.g. chart or diagram hosted on HTTPS).',
      )
      return
    }
    setStatus('saving')
    try {
      await createWritingPrompts(payload)
      setStatus('success')
      setMessage(`Saved ${String(payload.length)} prompt(s).`)
      setRows([newEmptyRow()])
      void loadPromptLibrary()
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const filteredLibrary =
    promptLibrary === null
      ? []
      : promptLibrary.filter(
          (p) => libraryFilter === 'all' || p.task === libraryFilter,
        )

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Backoffice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add one or more prompts: optional title, required body. For Task 1,
          upload an image to Firebase Storage or paste an HTTPS image URL. All
          rows share the selected task.
        </p>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured: set the VITE_FIREBASE_* keys in your{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code>{' '}
          file.
        </p>
      ) : null}

      {firebaseReady && task === 1 && !storageReady ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Set{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            VITE_FIREBASE_STORAGE_BUCKET
          </code>{' '}
          in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code>{' '}
          to enable image upload (same value as in the Firebase console).
        </p>
      ) : null}

      {firebaseReady && task === 1 && !authLoading && user === null ? (
        <p className="text-sm text-muted-foreground">
          Sign in with Google to upload Task 1 images from this device; you can
          still paste an HTTPS URL without signing in.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Task</CardTitle>
          <CardDescription>
            Task 1 (about 150 words, with an image) or Task 2 (about 250 words).
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={task === 1 ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setTask(1)
              }}
            >
              Task 1
            </Button>
            <Button
              type="button"
              variant={task === 2 ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setTask(2)
              }}
            >
              Task 2
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 border-b border-border pb-6 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Prompt {String(index + 1)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer text-destructive hover:text-destructive"
                  disabled={rows.length <= 1}
                  onClick={() => {
                    removeRow(row.id)
                  }}
                  aria-label="Remove prompt"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`title-${row.id}`}>Title (optional)</Label>
                <Input
                  id={`title-${row.id}`}
                  value={row.title}
                  onChange={(e) => {
                    updateRow(row.id, { title: e.target.value })
                  }}
                  placeholder="e.g. Bar chart — public spending"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`body-${row.id}`}>Prompt text</Label>
                <Textarea
                  id={`body-${row.id}`}
                  value={row.body}
                  onChange={(e) => {
                    updateRow(row.id, { body: e.target.value })
                  }}
                  placeholder="Paste the full prompt text"
                  rows={6}
                />
              </div>
              {task === 1 ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`image-${row.id}`}>
                    Task 1 image (required)
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <Input
                      id={`image-${row.id}`}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      value={row.imageUrl}
                      onChange={(e) => {
                        updateRow(row.id, { imageUrl: e.target.value })
                      }}
                      placeholder="https://… or upload a file"
                      className="sm:min-w-0 sm:flex-1"
                      aria-describedby={`image-help-${row.id}`}
                    />
                    <input
                      id={`file-${row.id}`}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      className="sr-only"
                      tabIndex={-1}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        void handleTask1FileSelected(row.id, file)
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="cursor-pointer shrink-0 sm:self-auto"
                      disabled={
                        !storageReady ||
                        !user ||
                        uploadingRowId === row.id ||
                        authLoading
                      }
                      aria-busy={uploadingRowId === row.id}
                      onClick={() => {
                        document.getElementById(`file-${row.id}`)?.click()
                      }}
                    >
                      {uploadingRowId === row.id ? 'Uploading…' : 'Upload file'}
                    </Button>
                  </div>
                  <p
                    id={`image-help-${row.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    PNG, JPEG, GIF, or WebP, max 4 MB. Upload fills the URL field
                    with a Firebase download link (works with Gemini feedback).
                  </p>
                </div>
              ) : null}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={addRow}
            >
              <Plus className="size-4" />
              Add prompt
            </Button>
            <Button
              type="button"
              className="cursor-pointer inline-flex items-center gap-2"
              disabled={status === 'saving'}
              aria-busy={status === 'saving'}
              onClick={() => {
                void handleSubmit()
              }}
            >
              {status === 'saving' ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save to Firebase'
              )}
            </Button>
          </div>

          {message ? (
            <p
              className={
                status === 'error'
                  ? 'text-sm text-destructive'
                  : 'text-sm text-muted-foreground'
              }
            >
              {message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {firebaseReady ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Prompts library</CardTitle>
                <CardDescription>
                  All prompts stored in Firestore. Filter by task or refresh
                  after saving new ones.
                </CardDescription>
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
                No prompts yet. Save some using the form above.
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
              <p className="text-sm text-muted-foreground">
                No prompts for this filter.
              </p>
            ) : null}
            <ul className="flex max-h-[min(32rem,70vh)] flex-col gap-3 overflow-y-auto pr-1">
              {filteredLibrary.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md border border-border bg-card p-3 text-sm shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                              p.task === 1
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            Task {String(p.task)}
                          </span>
                          {p.title.trim().length > 0 ? (
                            <span className="font-medium text-foreground">
                              {p.title}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Untitled
                            </span>
                          )}
                        </div>
                        <p className="break-all font-mono text-[11px] text-muted-foreground">
                          id: {p.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.createdAt !== null &&
                          typeof p.createdAt.toDate === 'function'
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
    </div>
  )
}
