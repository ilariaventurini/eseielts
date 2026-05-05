import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ROUTES } from '@/constants/routes.constants'
import { writingDraftStorageKey } from '@/constants/storage.constants'
import { TARGET_CEFR_LEVEL, WRITING_TASK_MIN_WORDS } from '@/constants/writing.constants'
import { isFirebaseConfigured } from '@/lib/firebase'
import { requestWritingFeedback } from '@/services/gemini-feedback.service'
import {
  createWritingAttempt,
  fetchRandomWritingPrompt,
} from '@/services/writing-firestore.service'
import type { GeminiFeedbackPayload } from '@/types/gemini.types'
import type { WritingPrompt, WritingTask } from '@/types/writing.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'
import { countWords } from '@/utils/word-count.utils'

type Phase = 'pick' | 'write' | 'done'

export default function WritingPage() {
  const [phase, setPhase] = useState<Phase>('pick')
  const [task, setTask] = useState<WritingTask>(2)
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null)
  const [answer, setAnswer] = useState('')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [feedback, setFeedback] = useState<GeminiFeedbackPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const startRef = useRef<number | null>(null)
  const firebaseReady = isFirebaseConfigured()

  const wordCount = countWords(answer)
  const minWords = prompt ? WRITING_TASK_MIN_WORDS[prompt.task] : 0
  const belowMin = phase === 'write' && prompt !== null && wordCount < minWords

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

  function persistAnswer(value: string) {
    setAnswer(value)
    if (prompt) {
      localStorage.setItem(writingDraftStorageKey(prompt.id), value)
    }
  }

  async function handleRandomPrompt() {
    setError(null)
    setFeedback(null)
    if (!firebaseReady) {
      setError('Configure Firebase (VITE_FIREBASE_*).')
      return
    }
    setLoading(true)
    try {
      const p = await fetchRandomWritingPrompt(task)
      if (!p) {
        setError('No prompts for this task. Add some in the backoffice.')
        return
      }
      const draftKey = writingDraftStorageKey(p.id)
      setAnswer(localStorage.getItem(draftKey) ?? '')
      setPrompt(p)
      setPhase('write')
      startRef.current = Date.now()
      setElapsedSec(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prompt')
    } finally {
      setLoading(false)
    }
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
        <Card>
          <CardHeader>
            <CardTitle>Choose a task</CardTitle>
            <CardDescription>Then draw a random prompt from the backoffice.</CardDescription>
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
          <CardContent>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={loading || !firebaseReady}
              onClick={() => {
                void handleRandomPrompt()
              }}
            >
              {loading ? 'Loading…' : 'Draw random prompt'}
            </Button>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {phase === 'write' && prompt ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {prompt.title.length > 0 ? prompt.title : `Task ${String(prompt.task)}`}
              </CardTitle>
              <CardDescription className="whitespace-pre-wrap">{prompt.body}</CardDescription>
              {prompt.imageUrl ? (
                <figure className="mt-4 overflow-hidden rounded-md border bg-muted">
                  <img
                    src={prompt.imageUrl}
                    alt={
                      prompt.title.length > 0
                        ? `${prompt.title} (Task 1 visual)`
                        : 'IELTS Task 1 visual — chart, map, diagram, or process'
                    }
                    className="mx-auto max-h-[min(28rem,55vh)] w-full object-contain"
                  />
                  <figcaption className="sr-only">
                    Task 1 image referenced in the prompt above.
                  </figcaption>
                </figure>
              ) : null}
            </CardHeader>
          </Card>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Timer: {formatClockSeconds(elapsedSec)}</span>
            <span>
              Words: {String(wordCount)} / suggested min. {String(minWords)}
            </span>
          </div>
          {belowMin ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              You are below the suggested minimum; you can still submit, but very short answers are
              penalised in IELTS Writing.
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="writing-answer">Your answer</Label>
            <Textarea
              id="writing-answer"
              value={answer}
              onChange={(e) => {
                persistAnswer(e.target.value)
              }}
              rows={16}
              placeholder="Write your response here…"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="cursor-pointer"
              disabled={loading || answer.trim().length === 0}
              onClick={() => {
                void handleSubmit()
              }}
            >
              {loading ? 'Sending to Gemini…' : 'Submit for feedback'}
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
