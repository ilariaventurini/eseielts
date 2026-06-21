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
import {
  createSpeakingAttempts,
  createSpeakingPrompts,
} from '@/services/speaking-firestore.service'
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

const BULK_IMPORT_FORMAT_BY_TASK: Readonly<
  Record<
    SpeakingTask,
    {
      readonly description: string
      readonly placeholder: string
    }
  >
> = {
  1: {
    description:
      'Each block: title line (e.g. 01 - Work), question line, answer lines. Blank line between blocks. Answers are saved as AI practice solutions.',
    placeholder: `01 - Work
Do you work or study?
I work as a web developer. I finished my studies a while ago, and I have been working for the same company since 2018.

02 - Work
What is your job?
I am a web developer specializing in data visualization. My job is to take complex data and turn it into clear, interactive charts and graphs on websites.`,
  },
  2: {
    description:
      'Each block: title line, cue card (intro + "You should say:" + bullet list), then the model answer. Blank line between blocks. Answers are saved as AI practice solutions.',
    placeholder: `01 - Work
Tell me about a person who is good at his/her job.
You should say:
- what kind of job he/she does
- what skills this job requires
- how long he/she has been doing this job
- and explain why you think he/she is good at this job
I want to talk about my uncle, Marco. He is a chef and he works in a small Italian restaurant in my hometown.`,
  },
  3: {
    description:
      'Each block: title line (e.g. 01 - Reading), question line, answer lines. Blank line between blocks. Answers are saved as AI practice solutions.',
    placeholder: `01 - Reading
In what way have our reading habits changed in recent years?
Well, I guess the way we read has changed a lot because of new technology. In the past, people only read paper books and physical newspapers.

02 - Reading
Do you think people read less today than they used to in the past?
I don't know much about the statistics, but I think people don't read less, they just read different things.`,
  },
}

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
  readonly solution: string
}

function newEmptyRow(): PromptRow {
  return { id: crypto.randomUUID(), title: '', body: '', solution: '' }
}

function buildAiSolutionAttempts(
  items: readonly { title: string; body: string; answer: string }[],
  promptIds: readonly string[],
  task: SpeakingTask,
) {
  return items
    .map((item, index) => ({
      item,
      promptId: promptIds[index],
    }))
    .filter(
      ({ item, promptId }) =>
        promptId !== undefined && item.answer.trim().length > 0,
    )
    .map(({ item, promptId }) => ({
      promptId: promptId as string,
      task,
      promptTitle: item.title.trim(),
      promptBody: item.body.trim(),
      notes: item.answer.trim(),
      extendedTimerMs: 0,
      practiceTypology: 'ai' as const,
    }))
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
    () => parseSpeakingPromptsImport(bulkImportText, task),
    [bulkImportText, task],
  )
  const bulkImportSolutionCount = useMemo(
    () => parsedBulkImport.filter((item) => item.answer.trim().length > 0).length,
    [parsedBulkImport],
  )
  const selectedTask =
    SPEAKING_TASK_OPTIONS.find((option) => option.value === task) ?? SPEAKING_TASK_OPTIONS[0]
  const bulkImportFormat = BULK_IMPORT_FORMAT_BY_TASK[task]

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
        solution: row.solution.trim(),
        practiceTypology: PRACTICE_TYPOLOGY_DEFAULT,
      }))
      .filter((row) => row.body.length > 0)
    if (payload.length === 0) {
      setStatus('error')
      setMessage('Add at least one question (required field).')
      return
    }
    setStatus('saving')
    try {
      const promptIds = await createSpeakingPrompts(
        payload.map(({ task: promptTask, title, body, practiceTypology }) => ({
          task: promptTask,
          title,
          body,
          practiceTypology,
        })),
      )
      const solutionAttempts = buildAiSolutionAttempts(
        payload.map(({ title, body, solution }) => ({
          title,
          body,
          answer: solution,
        })),
        promptIds,
        task,
      )
      if (solutionAttempts.length > 0) {
        await createSpeakingAttempts(solutionAttempts)
      }
      const solutionCount = solutionAttempts.length
      setStatus('success')
      setMessage(
        solutionCount > 0
          ? `Saved ${String(payload.length)} prompt(s) and ${String(solutionCount)} AI solution(s).`
          : `Saved ${String(payload.length)} prompt(s).`,
      )
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
        'Paste at least one valid block for the selected task. Check the format hint above the textarea.',
      )
      return
    }
    setBulkStatus('saving')
    try {
      const promptIds = await createSpeakingPrompts(
        parsedBulkImport.map((item) => ({
          task,
          title: item.title.trim(),
          body: item.body.trim(),
          practiceTypology: PRACTICE_TYPOLOGY_DEFAULT,
        })),
      )
      const solutionAttempts = buildAiSolutionAttempts(parsedBulkImport, promptIds, task)
      if (solutionAttempts.length > 0) {
        await createSpeakingAttempts(solutionAttempts)
      }
      setBulkStatus('success')
      setBulkMessage(
        solutionAttempts.length > 0
          ? `Saved ${String(parsedBulkImport.length)} prompt(s) and ${String(solutionAttempts.length)} AI solution(s) as ${selectedTask.label}.`
          : `Saved ${String(parsedBulkImport.length)} prompt(s) as ${selectedTask.label}.`,
      )
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
          IELTS Speaking has three parts. Add prompts per task: optional title, required question,
          optional AI solution. No images — text only. Browse saved prompts in{' '}
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
          <CardTitle>Bulk import — {selectedTask.label}</CardTitle>
          <CardDescription>{bulkImportFormat.description}</CardDescription>
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
              placeholder={bulkImportFormat.placeholder}
              rows={14}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {parsedBulkImport.length > 0
              ? `${String(parsedBulkImport.length)} prompt(s) ready to import as ${selectedTask.label}${bulkImportSolutionCount > 0 ? `, including ${String(bulkImportSolutionCount)} AI solution(s)` : ''}.`
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
          <CardTitle>Add prompts manually — {selectedTask.label}</CardTitle>
          <CardDescription>
            Add one or more prompts for {selectedTask.label} ({selectedTask.part}). Paste an
            optional AI solution to store a model answer with Practice type = AI.
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
                  placeholder="e.g. 01 - Work"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`speaking-body-${row.id}`}>Question</Label>
                <Textarea
                  id={`speaking-body-${row.id}`}
                  value={row.body}
                  onChange={(e) => {
                    updateRow(row.id, { body: e.target.value })
                  }}
                  placeholder={
                    task === 2
                      ? 'Cue card text, including bullet points'
                      : 'Examiner question for this task'
                  }
                  rows={task === 2 ? 8 : 4}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`speaking-solution-${row.id}`}>Solution — Practice type AI (optional)</Label>
                <Textarea
                  id={`speaking-solution-${row.id}`}
                  value={row.solution}
                  onChange={(e) => {
                    updateRow(row.id, { solution: e.target.value })
                  }}
                  placeholder="Model answer / svolgimento dell'esercizio"
                  rows={8}
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
