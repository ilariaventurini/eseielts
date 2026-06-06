import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { skillPromptsLibraryPath } from '@/constants/routes.constants'
import { useAuth } from '@/hooks/use-auth'
import { isFirebaseConfigured } from '@/lib/firebase'
import { createSpeakingPrompts } from '@/services/speaking-firestore.service'
import { PRACTICE_TYPOLOGY_DEFAULT } from '@/types/practice-typology.types'
import type { SpeakingTask } from '@/types/speaking.types'
import { parseSpeakingPromptsImport } from '@/utils/parse-speaking-prompts-import.utils'

const SPEAKING_TASK_OPTIONS: readonly {
  readonly value: SpeakingTask
  readonly label: string
  readonly part: string
  readonly description: string
}[] = [
  {
    value: 1,
    label: 'Task 1',
    part: 'Part 1',
    description: 'Short personal questions',
  },
  {
    value: 2,
    label: 'Task 2',
    part: 'Part 2',
    description: 'Cue card/long turn',
  },
  {
    value: 3,
    label: 'Task 3',
    part: 'Part 3',
    description: 'Discussion questions',
  },
]

interface SpeakingTaskPickerProps {
  readonly task: SpeakingTask
  readonly onTaskChange: (task: SpeakingTask) => void
}

function SpeakingTaskPicker({ task, onTaskChange }: SpeakingTaskPickerProps) {
  const selectedTask =
    SPEAKING_TASK_OPTIONS.find((option) => option.value === task) ?? SPEAKING_TASK_OPTIONS[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Speaking task">
        {SPEAKING_TASK_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={task === option.value ? 'default' : 'outline'}
            className="cursor-pointer"
            aria-pressed={task === option.value}
            onClick={() => {
              onTaskChange(option.value)
            }}
          >
            {option.label} — {option.part}
          </Button>
        ))}
      </div>
      <p>
        <span className="font-medium text-foreground">Selected:</span>{' '}
        <span className="text-foreground">
          {selectedTask.label} ({selectedTask.part})
        </span>
        <span className="text-muted-foreground"> — {selectedTask.description}</span>
      </p>
    </div>
  )
}

interface PromptRow {
  readonly id: string
  readonly title: string
  readonly body: string
}

function newEmptyRow(): PromptRow {
  return { id: crypto.randomUUID(), title: '', body: '' }
}

export default function SpeakingBackofficePage() {
  const { user } = useAuth()
  const [task, setTask] = useState<SpeakingTask>(1)
  const [rows, setRows] = useState<PromptRow[]>([newEmptyRow()])
  const [bulkImportText, setBulkImportText] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)

  const firebaseReady = isFirebaseConfigured()
  const parsedBulkImport = useMemo(
    () => parseSpeakingPromptsImport(bulkImportText),
    [bulkImportText]
  )
  const selectedTask =
    SPEAKING_TASK_OPTIONS.find((option) => option.value === task) ?? SPEAKING_TASK_OPTIONS[0]

  function updateRow(id: string, patch: Partial<Omit<PromptRow, 'id'>>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, newEmptyRow()])
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)))
  }

  async function handleSubmit() {
    setMessage(null)
    if (!firebaseReady) {
      setStatus('error')
      setMessage('Set the VITE_FIREBASE_* variables in your .env file.')
      return
    }
    if (user === null) {
      setStatus('error')
      setMessage('Sign in to save prompts to Firebase.')
      return
    }
    const payload = rows
      .map((row) => ({
        task,
        title: row.title.trim(),
        body: row.body.trim(),
        practiceTypology: PRACTICE_TYPOLOGY_DEFAULT,
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

  async function handleBulkImport() {
    setBulkMessage(null)
    if (!firebaseReady) {
      setBulkStatus('error')
      setBulkMessage('Set the VITE_FIREBASE_* variables in your .env file.')
      return
    }
    if (user === null) {
      setBulkStatus('error')
      setBulkMessage('Sign in to save prompts to Firebase.')
      return
    }
    if (parsedBulkImport.length === 0) {
      setBulkStatus('error')
      setBulkMessage(
        'Paste at least one prompt block: title on the first line, question on the next, blank line between blocks.'
      )
      return
    }
    setBulkStatus('saving')
    try {
      await createSpeakingPrompts(
        parsedBulkImport.map((item) => ({
          task,
          title: item.title,
          body: item.body,
          practiceTypology: PRACTICE_TYPOLOGY_DEFAULT,
        }))
      )
      setBulkStatus('success')
      setBulkMessage(`Saved ${String(parsedBulkImport.length)} prompt(s).`)
      setBulkImportText('')
    } catch (e) {
      setBulkStatus('error')
      setBulkMessage(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Speaking backoffice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          IELTS Speaking has three parts. Add prompts per task: optional title, required
          description. No images — text only. Browse saved prompts in{' '}
          <Link
            to={skillPromptsLibraryPath('speaking')}
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Prompts library
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

      {firebaseReady && user === null ? (
        <p className="text-sm text-destructive">Sign in with Google to save prompts to Firebase.</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Task</CardTitle>
          <CardDescription>
            Choose Task 1, 2, or 3 (Parts 1–3). Bulk import and manual prompts below will be saved
            under this task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpeakingTaskPicker
            task={task}
            onTaskChange={(nextTask) => {
              setTask(nextTask)
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk import</CardTitle>
          <CardDescription>
            Paste many prompts at once. Each block needs a title line, a question line, and a blank
            line before the next block.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="speaking-bulk-import">Prompt blocks</Label>
            <Textarea
              id="speaking-bulk-import"
              value={bulkImportText}
              onChange={(e) => {
                setBulkImportText(e.target.value)
              }}
              placeholder={`04 - Work 04\nWhat do you like about your job?\n\n05 - Work 05\nIs there something you don't like about your job?`}
              rows={14}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {parsedBulkImport.length > 0
              ? `${String(parsedBulkImport.length)} prompt(s) ready to import as ${selectedTask.label}.`
              : 'No valid prompts detected yet.'}
          </p>
          <Button
            type="button"
            className="cursor-pointer inline-flex w-fit items-center gap-2"
            disabled={bulkStatus === 'saving' || parsedBulkImport.length === 0}
            aria-busy={bulkStatus === 'saving'}
            onClick={() => {
              void handleBulkImport()
            }}
          >
            {bulkStatus === 'saving' ? (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Importing…
              </>
            ) : (
              `Import to Firebase as ${selectedTask.label}`
            )}
          </Button>
          {bulkMessage ? (
            <p
              className={
                bulkStatus === 'error'
                  ? 'text-sm text-destructive'
                  : 'text-sm text-muted-foreground'
              }
            >
              {bulkMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add prompts manually</CardTitle>
          <CardDescription>
            Add one or more prompts for {selectedTask.label} ({selectedTask.part}).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
            <Button type="button" variant="secondary" className="cursor-pointer" onClick={addRow}>
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
                status === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'
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
