import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { WritingTask1Visual } from '@/components/writing-task1-visual'
import { ROUTES } from '@/constants/routes.constants'
import { writingDraftStorageKey } from '@/constants/storage.constants'
import { TARGET_CEFR_LEVEL, WRITING_TASK_MIN_WORDS } from '@/constants/writing.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { requestWritingFeedback } from '@/services/gemini-feedback.service'
import {
  createWritingAttempt,
  fetchWritingPromptsByTask,
} from '@/services/writing-firestore.service'
import type { GeminiFeedbackPayload } from '@/types/gemini.types'
import type { WritingPrompt, WritingTask } from '@/types/writing.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'
import { countWords, paragraphWordCounts } from '@/utils/word-count.utils'

type Phase = 'pick' | 'write' | 'done'

export default function WritingPage() {
  const [phase, setPhase] = useState<Phase>('pick')
  const [task, setTask] = useState<WritingTask>(1)
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null)
  const [answer, setAnswer] = useState('')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [feedback, setFeedback] = useState<GeminiFeedbackPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [availablePrompts, setAvailablePrompts] = useState<WritingPrompt[] | null>(null)
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [promptsError, setPromptsError] = useState<string | null>(null)

  const startRef = useRef<number | null>(null)
  const firebaseReady = isFirebaseConfigured()

  const wordCount = countWords(answer)
  const minWords = prompt ? WRITING_TASK_MIN_WORDS[prompt.task] : 0
  const paragraphCounts = useMemo(() => paragraphWordCounts(answer), [answer])

  useEffect(() => {
    if (phase !== 'write' || !prompt || startRef.current === null) {
      return
    }
    const tick = () => {
      setElapsedSec(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [phase, prompt])

  const loadAvailablePrompts = useCallback(async () => {
    if (!firebaseReady) {
      return
    }
    setAvailablePrompts(null)
    setPromptsLoading(true)
    setPromptsError(null)
    try {
      const list = await fetchWritingPromptsByTask(task)
      setAvailablePrompts(list)
    } catch (e) {
      setPromptsError(e instanceof Error ? e.message : 'Failed to load prompts')
      setAvailablePrompts([])
    } finally {
      setPromptsLoading(false)
    }
  }, [firebaseReady, task])

  useEffect(() => {
    if (phase !== 'pick' || !firebaseReady) {
      return
    }
    const id = window.setTimeout(() => {
      void loadAvailablePrompts()
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [phase, firebaseReady, loadAvailablePrompts])

  function persistAnswer(value: string) {
    setAnswer(value)
    if (prompt) {
      localStorage.setItem(writingDraftStorageKey(prompt.id), value)
    }
  }

  function startWithPrompt(p: WritingPrompt) {
    setError(null)
    setFeedback(null)
    const draftKey = writingDraftStorageKey(p.id)
    setAnswer(localStorage.getItem(draftKey) ?? '')
    setPrompt(p)
    setPhase('write')
    startRef.current = Date.now()
    setElapsedSec(0)
  }

  function handleRandomPrompt() {
    setError(null)
    setFeedback(null)
    if (!firebaseReady) {
      setError('Configure Firebase (VITE_FIREBASE_*).')
      return
    }
    if (!availablePrompts || availablePrompts.length === 0) {
      setError('No prompts for this task. Add some in the backoffice.')
      return
    }
    const idx = Math.floor(Math.random() * availablePrompts.length)
    const p = availablePrompts[idx]
    if (!p) {
      return
    }
    startWithPrompt(p)
  }

  async function handleSubmit() {
    if (!prompt || startRef.current === null) {
      return
    }
    setError(null)
    setLoading(true)
    const durationMs = Date.now() - startRef.current
    const wc = countWords(answer)
    try {
      const { feedback: fb, rawText } = await requestWritingFeedback({
        task: prompt.task,
        promptTitle: prompt.title.length > 0 ? prompt.title : `Task ${String(prompt.task)}`,
        promptBody: prompt.body,
        promptImageUrl: prompt.imageUrl,
        answer,
        wordCount: wc,
        durationMs,
        targetLevel: TARGET_CEFR_LEVEL,
      })
      if (firebaseReady) {
        await createWritingAttempt({
          promptId: prompt.id,
          task: prompt.task,
          promptTitle: prompt.title.length > 0 ? prompt.title : `Task ${String(prompt.task)}`,
          promptBody: prompt.body,
          promptImageUrl: prompt.imageUrl,
          answer,
          wordCount: wc,
          durationMs,
          feedback: fb,
          rawModelText: rawText,
        })
      }
      localStorage.removeItem(writingDraftStorageKey(prompt.id))
      setFeedback(fb)
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Feedback request failed')
    } finally {
      setLoading(false)
    }
  }

  function handleNewSession() {
    if (prompt) {
      localStorage.removeItem(writingDraftStorageKey(prompt.id))
    }
    setPhase('pick')
    setPrompt(null)
    setAnswer('')
    setFeedback(null)
    setElapsedSec(0)
    startRef.current = null
    setError(null)
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Timer, word count, random prompt, Gemini feedback ({TARGET_CEFR_LEVEL}
            ).
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link to={ROUTES.writingHistory}>View history</Link>
        </Button>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured: set VITE_FIREBASE_* to load prompts and save attempts.
        </p>
      ) : null}

      {phase === 'pick' ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={task === 1 ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTask(1)}
            >
              Task 1
            </Button>
            <Button
              type="button"
              variant={task === 2 ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTask(2)}
            >
              Task 2
            </Button>
          </div>
          <Button
            type="button"
            className="cursor-pointer inline-flex w-fit items-center gap-2"
            disabled={
              !firebaseReady ||
              promptsLoading ||
              availablePrompts === null ||
              availablePrompts.length === 0
            }
            onClick={handleRandomPrompt}
          >
            Draw random prompt
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">Or pick a specific exercise</h2>
            {promptsError ? <p className="text-sm text-destructive">{promptsError}</p> : null}
            {promptsLoading && availablePrompts === null ? (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Loading exercises…
              </div>
            ) : null}
            {availablePrompts !== null && availablePrompts.length === 0 && !promptsLoading ? (
              <p className="text-sm text-muted-foreground">
                No exercises for Task {String(task)} yet. Add some in the backoffice.
              </p>
            ) : null}
            {availablePrompts !== null && availablePrompts.length > 0 ? (
              <ul className="flex max-h-[min(28rem,60vh)] flex-col gap-2 overflow-y-auto pr-1">
                {availablePrompts.map((p) => {
                  const label = p.title.trim().length > 0 ? p.title : 'Untitled'
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => startWithPrompt(p)}
                        className={cn(
                          'group flex w-full cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 text-left text-sm shadow-sm transition-colors',
                          'hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        )}
                        aria-label={`Start exercise: ${label}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{label}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {p.body}
                          </p>
                        </div>
                        {p.task === 1 && p.imageUrl ? (
                          <div className="shrink-0 overflow-hidden rounded border bg-muted">
                            <img src={p.imageUrl} alt="" className="size-16 object-cover" />
                          </div>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === 'write' && prompt ? (
        <div className="flex flex-col gap-y-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {prompt.title.length > 0 ? prompt.title : `Task ${String(prompt.task)}`}
              </CardTitle>
              <CardDescription className="whitespace-pre-wrap">{prompt.body}</CardDescription>
              {prompt.imageUrl ? (
                <WritingTask1Visual
                  imageUrl={prompt.imageUrl}
                  imageAlt={
                    prompt.title.length > 0
                      ? `${prompt.title} (Task 1 visual)`
                      : 'IELTS Task 1 visual — chart, map, diagram, or process'
                  }
                  resetTransformKey={prompt.id}
                />
              ) : null}
            </CardHeader>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-x-2">
              <span className="min-w-16">⏱ {formatClockSeconds(elapsedSec)}</span>
              <span className="min-w-16">
                💬 {String(wordCount)}/{String(minWords)}
              </span>
            </div>
            {paragraphCounts.length > 0 ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                <span className="sr-only">Words per paragraph (blank-line separated): </span>
                {paragraphCounts.map((n, i) => `p${String(i + 1)}: ${String(n)}`).join(' · ')}
              </p>
            ) : null}
          </div>

          <Textarea
            id="writing-answer"
            value={answer}
            onChange={(e) => persistAnswer(e.target.value)}
            rows={16}
            placeholder="Write your response here…"
            aria-label="Your writing response"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="cursor-pointer inline-flex items-center gap-2"
              disabled={loading || answer.trim().length === 0}
              aria-busy={loading}
              onClick={() => {
                void handleSubmit()
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Sending to Gemini…
                </>
              ) : (
                'Submit for feedback'
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              disabled={loading}
              onClick={handleNewSession}
            >
              Cancel session
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Feedback uses the Netlify function{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">gemini-feedback</code>.
              Locally, use{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">yarn dev:netlify</code> and
              open the app on the port Netlify shows (not plain{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">yarn dev</code>
              ), or set{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_GEMINI_FEEDBACK_URL</code>
              .
            </p>
          )}
        </div>
      ) : null}

      {phase === 'done' && feedback ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>
                Estimated band (0–9):{' '}
                <span className="font-semibold text-foreground">{String(feedback.band)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <section>
                <h3 className="font-medium text-foreground">Correction</h3>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {feedback.correction}
                </p>
              </section>
              <section>
                <h3 className="font-medium text-foreground">Model answer (B1/B2)</h3>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {feedback.modelAnswer}
                </p>
              </section>
              {feedback.criteria ? (
                <section className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ['Task response', feedback.criteria.taskResponse],
                      ['Coherence', feedback.criteria.coherence],
                      ['Lexical resource', feedback.criteria.lexicalResource],
                      ['Grammatical range', feedback.criteria.grammaticalRange],
                    ] as const
                  ).map(([label, text]) => (
                    <div key={label}>
                      <h4 className="text-xs font-medium tracking-wide uppercase">{label}</h4>
                      <p className="mt-1 text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </section>
              ) : null}
              {feedback.strengths && feedback.strengths.length > 0 ? (
                <section>
                  <h3 className="font-medium text-foreground">Strengths</h3>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {feedback.strengths.map((s, i) => (
                      <li key={`${String(i)}-${s}`}>{s}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {feedback.improvements && feedback.improvements.length > 0 ? (
                <section>
                  <h3 className="font-medium text-foreground">To improve</h3>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {feedback.improvements.map((s, i) => (
                      <li key={`${String(i)}-${s}`}>{s}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="cursor-pointer" onClick={handleNewSession}>
              New attempt
            </Button>
            <Button asChild variant="outline" className="cursor-pointer">
              <Link to={ROUTES.writingHistory}>Open history</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
