import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

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
import { skillPromptsLibraryPath } from '@/constants/routes.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import { createSpeakingPrompts } from '@/services/speaking-firestore.service'
import type { SpeakingTask } from '@/types/speaking.types'

interface PromptRow {
  readonly id: string
  readonly title: string
  readonly body: string
}

function newEmptyRow(): PromptRow {
  return { id: crypto.randomUUID(), title: '', body: '' }
}

export default function SpeakingBackofficePage() {
  const [task, setTask] = useState<SpeakingTask>(1)
  const [rows, setRows] = useState<PromptRow[]>([newEmptyRow()])
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  )
  const [message, setMessage] = useState<string | null>(null)

  const firebaseReady = isFirebaseConfigured()

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
      }))
      .filter((row) => row.body.length > 0)
    if (payload.length === 0) {
      setStatus('error')
      setMessage('Add at least one description (required field).')
      return
    }
    setStatus('saving')
    try {
      await createSpeakingPrompts(payload)
      setStatus('success')
      setMessage(`Saved ${String(payload.length)} prompt(s).`)
      setRows([newEmptyRow()])
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Speaking backoffice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          IELTS Speaking has three parts. Add prompts per task: optional title,
          required description. No images — text only. Browse saved prompts in{' '}
          <Link
            to={skillPromptsLibraryPath('speaking')}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Prompts library
          </Link>
          .
        </p>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured: set the VITE_FIREBASE_* keys in your{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code>{' '}
          file.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Task</CardTitle>
          <CardDescription>
            Choose Task 1, 2, or 3 (Parts 1–3). All rows in the form below share
            this task.
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-2">
            {([1, 2, 3] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={task === t ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  setTask(t)
                }}
              >
                Task {String(t)}
              </Button>
            ))}
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
                <Label htmlFor={`speaking-title-${row.id}`}>Title (optional)</Label>
                <Input
                  id={`speaking-title-${row.id}`}
                  value={row.title}
                  onChange={(e) => {
                    updateRow(row.id, { title: e.target.value })
                  }}
                  placeholder="Short label for this prompt"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`speaking-body-${row.id}`}>Description</Label>
                <Textarea
                  id={`speaking-body-${row.id}`}
                  value={row.body}
                  onChange={(e) => {
                    updateRow(row.id, { body: e.target.value })
                  }}
                  placeholder="Full prompt or instructions for this task"
                  rows={6}
                />
              </div>
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
    </div>
  )
}
