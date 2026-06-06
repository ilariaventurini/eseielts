import { Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'

import { StudyHelpMarkdown } from '@/components/study-help-markdown'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  helpDocTabDefinition,
  IELTS_HELP_DOC_TAB_DEFINITIONS,
} from '@/constants/help-doc.constants'
import { ROUTES } from '@/constants/routes.constants'
import { useAuth } from '@/hooks/use-auth'
import { isFirebaseConfigured } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { fetchHelpDoc, upsertHelpDoc } from '@/services/help-doc-firestore.service'
import type { HelpDocTabId } from '@/types/help-doc.types'

type EditorSource = 'firestore' | 'bundled' | 'unsaved'

function hasUnsavedFirestoreChanges(draft: string, savedFirestoreBody: string | null) {
  const normalizedDraft = draft.trim()
  if (normalizedDraft.length === 0) {
    return false
  }
  if (savedFirestoreBody === null) {
    return true
  }
  return normalizedDraft !== savedFirestoreBody.trim()
}

export default function HelpDocsBackofficePage() {
  const { user, authLoading } = useAuth()
  const firebaseReady = isFirebaseConfigured()
  const defaultTabId = IELTS_HELP_DOC_TAB_DEFINITIONS[0]?.tabId ?? 'study-tips'

  const [activeTabId, setActiveTabId] = useState<HelpDocTabId>(defaultTabId)
  const [draft, setDraft] = useState('')
  const [savedFirestoreBody, setSavedFirestoreBody] = useState<string | null>(null)
  const [editorSource, setEditorSource] = useState<EditorSource>('bundled')
  const [tabLoading, setTabLoading] = useState(false)
  const [tabError, setTabError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  )
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const activeDefinition = helpDocTabDefinition(activeTabId)
  const canSaveToFirestore = hasUnsavedFirestoreChanges(draft, savedFirestoreBody)

  const loadTab = useCallback(
    async (tabId: HelpDocTabId) => {
      if (!firebaseReady) {
        const def = helpDocTabDefinition(tabId)
        setDraft(def.defaultMarkdown)
        setSavedFirestoreBody(null)
        setEditorSource('bundled')
        return
      }
      setTabLoading(true)
      setTabError(null)
      try {
        const record = await fetchHelpDoc(tabId)
        const def = helpDocTabDefinition(tabId)
        if (record !== null && record.body.trim().length > 0) {
          setDraft(record.body)
          setSavedFirestoreBody(record.body)
          setEditorSource('firestore')
          return
        }
        setDraft(def.defaultMarkdown)
        setSavedFirestoreBody(null)
        setEditorSource('bundled')
      } catch (e) {
        setTabError(e instanceof Error ? e.message : 'Failed to load tab')
        const def = helpDocTabDefinition(tabId)
        setDraft(def.defaultMarkdown)
        setSavedFirestoreBody(null)
        setEditorSource('bundled')
      } finally {
        setTabLoading(false)
      }
    },
    [firebaseReady],
  )

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadTab(activeTabId)
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [activeTabId, loadTab])

  function handleTabChange(nextTabId: string) {
    if (!IELTS_HELP_DOC_TAB_DEFINITIONS.some((tab) => tab.tabId === nextTabId)) {
      return
    }
    setActiveTabId(nextTabId as HelpDocTabId)
    setSaveState('idle')
    setSaveMessage(null)
    setPreviewOpen(false)
  }

  function handleDraftChange(value: string) {
    setDraft(value)
    setEditorSource('unsaved')
    setSaveState('idle')
    setSaveMessage(null)
  }

  function handleLoadBundledDefault() {
    setDraft(activeDefinition.defaultMarkdown)
    setEditorSource('unsaved')
    setSaveState('idle')
    setSaveMessage(null)
  }

  async function handleSave() {
    setSaveMessage(null)
    if (!firebaseReady) {
      setSaveState('error')
      setSaveMessage('Configure Firebase (VITE_FIREBASE_*).')
      return
    }
    if (user === null) {
      setSaveState('error')
      setSaveMessage('Sign in to save help docs to Firestore.')
      return
    }
    const body = draft.trim()
    if (body.length === 0) {
      setSaveState('error')
      setSaveMessage('Body cannot be empty.')
      return
    }
    setSaveState('saving')
    try {
      await upsertHelpDoc(activeTabId, body)
      setSavedFirestoreBody(body)
      setEditorSource('firestore')
      setSaveState('success')
      setSaveMessage('Saved to Firestore.')
    } catch (e) {
      setSaveState('error')
      setSaveMessage(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Help docs backoffice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the markdown shown in the IELTS help dialog (book icon in the header).
          Documents are stored in Firestore collection{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">helpDocs</code> with
          one document per tab. Signed-in users see Firestore content when present;
          otherwise the app falls back to bundled files in{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">public/docs/</code>.
          Return to{' '}
          <Link
            to={ROUTES.writingBackoffice}
            className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Writing backoffice
          </Link>
          .
        </p>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured: set VITE_FIREBASE_* in your .env file.
        </p>
      ) : null}

      {firebaseReady && !authLoading && user === null ? (
        <p className="text-sm text-muted-foreground">
          Sign in with Google to save help docs.
        </p>
      ) : null}

      <Tabs value={activeTabId} onValueChange={handleTabChange}>
        <TabsList aria-label="Help doc tabs" className="flex h-auto flex-wrap gap-1">
          {IELTS_HELP_DOC_TAB_DEFINITIONS.map((tab) => (
            <TabsTrigger key={tab.tabId} value={tab.tabId} className="cursor-pointer">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {IELTS_HELP_DOC_TAB_DEFINITIONS.map((tab) => (
          <TabsContent
            key={tab.tabId}
            value={tab.tabId}
            className="mt-4 flex flex-col gap-4 outline-none"
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{tab.label}</CardTitle>
                    <CardDescription>
                      Document id:{' '}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {tab.tabId}
                      </code>
                      . Source in editor:{' '}
                      <span className="font-medium text-foreground">
                        {editorSource === 'firestore'
                          ? 'Firestore'
                          : editorSource === 'bundled'
                            ? 'bundled default'
                            : 'unsaved changes'}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer inline-flex shrink-0 items-center gap-2"
                    disabled={tabLoading}
                    aria-busy={tabLoading}
                    onClick={() => {
                      void loadTab(tab.tabId)
                    }}
                  >
                    {tabLoading ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="size-4 shrink-0" aria-hidden />
                    )}
                    Reload
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {tabError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {tabError}
                  </p>
                ) : null}
                {tabLoading ? (
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    Loading…
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`help-doc-body-${tab.tabId}`}>Markdown body</Label>
                      <Textarea
                        id={`help-doc-body-${tab.tabId}`}
                        value={draft}
                        onChange={(e) => {
                          handleDraftChange(e.target.value)
                        }}
                        rows={18}
                        className="font-mono text-xs leading-relaxed"
                        spellCheck={false}
                        aria-describedby={`help-doc-hint-${tab.tabId}`}
                      />
                      <p
                        id={`help-doc-hint-${tab.tabId}`}
                        className="text-xs text-muted-foreground"
                      >
                        GitHub-flavored Markdown (lists, tables, headings). Save pushes
                        to Firestore; the help dialog reads from there when signed in.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="cursor-pointer inline-flex items-center gap-2"
                        disabled={
                          saveState === 'saving' || tabLoading || !canSaveToFirestore
                        }
                        aria-busy={saveState === 'saving'}
                        onClick={() => {
                          void handleSave()
                        }}
                      >
                        {saveState === 'saving' ? (
                          <>
                            <Loader2
                              className="size-4 shrink-0 animate-spin"
                              aria-hidden
                            />
                            Saving…
                          </>
                        ) : (
                          'Save to Firestore'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="cursor-pointer"
                        disabled={tabLoading}
                        onClick={handleLoadBundledDefault}
                      >
                        Load bundled default
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        disabled={tabLoading}
                        onClick={() => {
                          setPreviewOpen((open) => !open)
                        }}
                        aria-expanded={previewOpen}
                      >
                        {previewOpen ? 'Hide preview' : 'Show preview'}
                      </Button>
                    </div>
                    {saveMessage ? (
                      <p
                        className={cn(
                          'text-sm',
                          saveState === 'error'
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        )}
                        role="status"
                      >
                        {saveMessage}
                      </p>
                    ) : null}
                    {previewOpen ? (
                      <div className="max-h-[min(28rem,60vh)] overflow-y-auto rounded-sm border border-border bg-card p-4">
                        <StudyHelpMarkdown markdown={draft} />
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
