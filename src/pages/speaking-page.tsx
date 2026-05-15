import { Loader2, Pause, Play, Timer } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ROUTES } from '@/constants/routes.constants'
import {
  SPEAKING_EXTENDED_GREEN_AT_ELAPSED_SEC,
  SPEAKING_FIRST_MINUTE_ELAPSED_SEC,
} from '@/constants/speaking.constants'
import { speakingNotesStorageKey } from '@/constants/storage.constants'
import { useAuth } from '@/hooks/use-auth'
import { isFirebaseConfigured } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import {
  createSpeakingAttempt,
  fetchSpeakingPromptsByTask,
} from '@/services/speaking-firestore.service'
import type { SpeakingPrompt, SpeakingTask } from '@/types/speaking.types'
import { formatClockSeconds } from '@/utils/format-duration.utils'

type Phase = 'pick' | 'practice'

export default function SpeakingPage() {
  const [phase, setPhase] = useState<Phase>('pick')
  const [task, setTask] = useState<SpeakingTask>(1)
  const [prompt, setPrompt] = useState<SpeakingPrompt | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [availablePrompts, setAvailablePrompts] = useState<SpeakingPrompt[] | null>(null)
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [promptsError, setPromptsError] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [submittedExtendedMs, setSubmittedExtendedMs] = useState<number | null>(
    null,
  )

  const { user } = useAuth()

  const [elapsedSec, setElapsedSec] = useState(0)
  const [timerPaused, setTimerPaused] = useState(false)
  const accumulatedMsRef = useRef(0)
  const runStartRef = useRef<number | null>(null)

  const [extendedElapsedSec, setExtendedElapsedSec] = useState(0)
  const [extendedHasStarted, setExtendedHasStarted] = useState(false)
  const [extendedTimerPaused, setExtendedTimerPaused] = useState(true)
  const extendedAccumulatedMsRef = useRef(0)
  const extendedRunStartRef = useRef<number | null>(null)

  const firebaseReady = isFirebaseConfigured()
  const firstMinutePassed = elapsedSec >= SPEAKING_FIRST_MINUTE_ELAPSED_SEC
  const extendedGreenReached =
    extendedElapsedSec >= SPEAKING_EXTENDED_GREEN_AT_ELAPSED_SEC

  useEffect(() => {
    if (phase !== 'practice' || !prompt || runStartRef.current === null) {
      return
    }
    const tick = () => {
      const runMs =
        runStartRef.current !== null ? Date.now() - runStartRef.current : 0
      setElapsedSec(Math.floor((accumulatedMsRef.current + runMs) / 1000))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [phase, prompt, timerPaused])

  useEffect(() => {
    if (
      phase !== 'practice' ||
      !prompt ||
      !extendedHasStarted ||
      extendedTimerPaused ||
      extendedRunStartRef.current === null
    ) {
      return
    }
    const tick = () => {
      const runMs =
        extendedRunStartRef.current !== null
          ? Date.now() - extendedRunStartRef.current
          : 0
      setExtendedElapsedSec(
        Math.floor((extendedAccumulatedMsRef.current + runMs) / 1000),
      )
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [phase, prompt, extendedHasStarted, extendedTimerPaused])

  const loadAvailablePrompts = useCallback(async () => {
    if (!firebaseReady) {
      return
    }
    setAvailablePrompts(null)
    setPromptsLoading(true)
    setPromptsError(null)
    try {
      const list = await fetchSpeakingPromptsByTask(task)
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

  function persistNotes(value: string) {
    setNotes(value)
    if (prompt) {
      localStorage.setItem(speakingNotesStorageKey(prompt.id), value)
    }
  }

  function resetSessionTimer() {
    accumulatedMsRef.current = 0
    runStartRef.current = null
    setElapsedSec(0)
    setTimerPaused(false)
  }

  function resetExtendedTimer() {
    extendedAccumulatedMsRef.current = 0
    extendedRunStartRef.current = null
    setExtendedElapsedSec(0)
    setExtendedHasStarted(false)
    setExtendedTimerPaused(true)
  }

  function startWithPrompt(p: SpeakingPrompt) {
    setError(null)
    setSaveError(null)
    setSaveSuccess(false)
    setSubmittedExtendedMs(null)
    resetSessionTimer()
    resetExtendedTimer()
    const notesKey = speakingNotesStorageKey(p.id)
    setNotes(localStorage.getItem(notesKey) ?? '')
    setPrompt(p)
    setPhase('practice')
    runStartRef.current = Date.now()
    setElapsedSec(0)
  }

  function handleToggleTimerPause() {
    if (runStartRef.current !== null) {
      accumulatedMsRef.current += Date.now() - runStartRef.current
      runStartRef.current = null
      setElapsedSec(Math.floor(accumulatedMsRef.current / 1000))
      setTimerPaused(true)
      return
    }
    runStartRef.current = Date.now()
    setTimerPaused(false)
  }

  function handleToggleExtendedTimer() {
    if (extendedRunStartRef.current !== null) {
      extendedAccumulatedMsRef.current += Date.now() - extendedRunStartRef.current
      extendedRunStartRef.current = null
      setExtendedElapsedSec(Math.floor(extendedAccumulatedMsRef.current / 1000))
      setExtendedTimerPaused(true)
      return
    }
    if (!extendedHasStarted) {
      setExtendedHasStarted(true)
    }
    extendedRunStartRef.current = Date.now()
    setExtendedTimerPaused(false)
  }

  function handleRandomPrompt() {
    setError(null)
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

  function getExtendedElapsedMsAtNow() {
    const runMs =
      extendedRunStartRef.current !== null
        ? Date.now() - extendedRunStartRef.current
        : 0
    return extendedAccumulatedMsRef.current + runMs
  }

  async function handleSubmitPractice() {
    if (!prompt) {
      return
    }
    setSaveError(null)
    setSaveSuccess(false)
    if (!firebaseReady) {
      setSaveError('Configure Firebase (VITE_FIREBASE_*).')
      return
    }
    if (!user) {
      setSaveError('Sign in to save your practice.')
      return
    }
    setSubmitLoading(true)
    try {
      const extendedTimerMs = getExtendedElapsedMsAtNow()
      await createSpeakingAttempt({
        promptId: prompt.id,
        task: prompt.task,
        promptTitle:
          prompt.title.length > 0 ? prompt.title : `Task ${String(prompt.task)}`,
        promptBody: prompt.body,
        notes,
        extendedTimerMs,
      })
      setSubmittedExtendedMs(extendedTimerMs)
      setSaveSuccess(true)
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Failed to save'
      const isPermission =
        /permission|insufficient permissions|missing or insufficient/i.test(raw)
      setSaveError(
        isPermission
          ? 'Firestore blocked this save. Deploy the latest rules (including speakingAttempts) with `firebase deploy --only firestore:rules`, and confirm you are signed in with the same Firebase project as this app.'
          : raw,
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  function handleNewSession() {
    setPhase('pick')
    setPrompt(null)
    setNotes('')
    resetSessionTimer()
    resetExtendedTimer()
    setError(null)
    setSaveError(null)
    setSaveSuccess(false)
    setSubmittedExtendedMs(null)
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Speaking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a task and prompt: the warm-up timer starts automatically (pause anytime). Use
            the session timer for your timed practice; it turns green after 2.5 minutes. Notes are
            optional.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link to={ROUTES.speakingHistory}>View history</Link>
        </Button>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured: set VITE_FIREBASE_* to load prompts.
        </p>
      ) : null}

      {phase === 'pick' ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={task === t ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTask(t)}
                aria-pressed={task === t}
              >
                Task {String(t)}
              </Button>
            ))}
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
            <h2 className="text-sm font-medium text-foreground">
              Or pick a specific exercise
            </h2>
            {promptsError ? (
              <p className="text-sm text-destructive">{promptsError}</p>
            ) : null}
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
                          'hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        )}
                        aria-label={`Start exercise: ${label}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{label}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {p.body}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === 'practice' && prompt ? (
        <div className="flex flex-col gap-y-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {prompt.title.length > 0 ? prompt.title : `Task ${String(prompt.task)}`}
              </CardTitle>
              <CardDescription className="whitespace-pre-wrap">{prompt.body}</CardDescription>
            </CardHeader>
          </Card>

          <div
            className="rounded-md border border-border bg-card p-4 text-sm"
            aria-label={[
              timerPaused ? 'Warm-up timer, paused' : 'Warm-up timer, running',
              firstMinutePassed ? ', more than one minute elapsed' : '',
            ].join('')}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="size-3.5 shrink-0" aria-hidden />
                  <span>Warm-up timer</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="text-muted-foreground" aria-hidden>
                    ⏱
                  </span>
                  <span
                    className={cn(
                      'font-mono tabular-nums',
                      firstMinutePassed
                        ? 'font-semibold text-destructive'
                        : 'text-foreground',
                    )}
                  >
                    {formatClockSeconds(elapsedSec)}
                  </span>
                  {timerPaused ? (
                    <span className="text-muted-foreground">Paused</span>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer shrink-0 gap-1.5"
                onClick={handleToggleTimerPause}
                aria-pressed={timerPaused}
                aria-label={timerPaused ? 'Resume warm-up timer' : 'Pause warm-up timer'}
              >
                {timerPaused ? (
                  <>
                    <Play className="size-3.5 shrink-0" aria-hidden />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="size-3.5 shrink-0" aria-hidden />
                    Pause
                  </>
                )}
              </Button>
            </div>
          </div>

          <div
            className="rounded-md border border-border bg-card p-4 text-sm"
            aria-label={[
              !extendedHasStarted
                ? 'Session timer, not started'
                : extendedTimerPaused
                  ? 'Session timer, paused'
                  : 'Session timer, running',
              extendedGreenReached ? ', at or past two and a half minutes' : '',
            ].join('')}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="size-3.5 shrink-0" aria-hidden />
                  <span>Session timer</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="text-muted-foreground" aria-hidden>
                    ⏱
                  </span>
                  <span
                    className={cn(
                      'font-mono tabular-nums',
                      extendedGreenReached
                        ? 'font-semibold text-green-600 dark:text-green-400'
                        : 'text-foreground',
                    )}
                  >
                    {formatClockSeconds(extendedElapsedSec)}
                  </span>
                  {extendedHasStarted && extendedTimerPaused ? (
                    <span className="text-muted-foreground">Paused</span>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer shrink-0 gap-1.5"
                onClick={handleToggleExtendedTimer}
                aria-pressed={
                  extendedHasStarted ? !extendedTimerPaused : false
                }
                aria-label={
                  !extendedHasStarted
                    ? 'Start session timer'
                    : extendedTimerPaused
                      ? 'Resume session timer'
                      : 'Pause session timer'
                }
              >
                {!extendedHasStarted || extendedTimerPaused ? (
                  <>
                    <Play className="size-3.5 shrink-0" aria-hidden />
                    {!extendedHasStarted ? 'Start' : 'Resume'}
                  </>
                ) : (
                  <>
                    <Pause className="size-3.5 shrink-0" aria-hidden />
                    Pause
                  </>
                )}
              </Button>
            </div>
          </div>

          <Textarea
            id="speaking-notes"
            value={notes}
            onChange={(e) => persistNotes(e.target.value)}
            rows={12}
            placeholder="Optional notes or bullet points for your answer…"
            aria-label="Notes for your speaking practice"
          />

          <div className="flex flex-col gap-2">
            {!user ? (
              <p className="text-sm text-muted-foreground">
                <Link
                  to={ROUTES.signIn}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{' '}
                to save your session timer and notes to Firebase.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="cursor-pointer inline-flex items-center gap-2"
                disabled={!firebaseReady || !user || submitLoading}
                aria-busy={submitLoading}
                onClick={() => {
                  void handleSubmitPractice()
                }}
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Submit practice'
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer"
                disabled={submitLoading}
                onClick={handleNewSession}
              >
                Cancel session
              </Button>
            </div>
            {saveError ? (
              <p className="text-sm text-destructive" role="alert">
                {saveError}
              </p>
            ) : null}
            {saveSuccess && submittedExtendedMs !== null ? (
              <p className="text-sm text-green-600 dark:text-green-400" role="status">
                Saved: session timer (
                {formatClockSeconds(Math.floor(submittedExtendedMs / 1000))}
                ) stored in Firestore.
              </p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
