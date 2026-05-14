import { Loader2, Plus, RefreshCw } from 'lucide-react'
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
import { isFirebaseConfigured } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import {
  createSectionContentItem,
  fetchSectionContentItems,
} from '@/services/section-content-firestore.service'
import type { SectionContentItem, SectionContentSkill } from '@/types/section-content.types'

interface SectionContentBackofficePageProps {
  readonly skill: SectionContentSkill
}

function sectionHeading(skill: SectionContentSkill) {
  if (skill === 'listening') {
    return 'Listening'
  }
  return 'Reading'
}

function formatWhen(item: SectionContentItem) {
  const ts = item.createdAt
  if (ts == null) {
    return '—'
  }
  return ts.toDate().toLocaleString('en-GB')
}

export default function SectionContentBackofficePage({
  skill,
}: SectionContentBackofficePageProps) {
  const label = sectionHeading(skill)
  const firebaseReady = isFirebaseConfigured()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [items, setItems] = useState<SectionContentItem[] | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle',
  )
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    if (!firebaseReady) {
      return
    }
    setListLoading(true)
    setListError(null)
    try {
      const list = await fetchSectionContentItems(skill)
      setItems(list)
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Failed to load items')
      setItems([])
    } finally {
      setListLoading(false)
    }
  }, [firebaseReady, skill])

  useEffect(() => {
    if (!firebaseReady) {
      return
    }
    const id = window.setTimeout(() => {
      void loadList()
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [firebaseReady, loadList])

  async function handleSubmit() {
    setSaveMessage(null)
    if (!firebaseReady) {
      setSaveState('error')
      setSaveMessage('Configure Firebase (VITE_FIREBASE_*).')
      return
    }
    const t = title.trim()
    const b = body.trim()
    if (b.length === 0) {
      setSaveState('error')
      setSaveMessage('Body is required.')
      return
    }
    setSaveState('saving')
    try {
      await createSectionContentItem(skill, { title: t, body: b })
      setSaveState('success')
      setSaveMessage('Saved.')
      setTitle('')
      setBody('')
      void loadList()
    } catch (e) {
      setSaveState('error')
      setSaveMessage(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {label} backoffice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seed content for future {label.toLowerCase()} exercises: title and body
          only. Signed-in users can read and write (same model as writing prompts).
        </p>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured: set VITE_FIREBASE_* in your .env file.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>New item</CardTitle>
          <CardDescription>
            Minimal shape for admin seeding until task formats are defined.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`section-title-${skill}`}>Title</Label>
            <Input
              id={`section-title-${skill}`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
              }}
              placeholder="Short label"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`section-body-${skill}`}>Body</Label>
            <Textarea
              id={`section-body-${skill}`}
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
              }}
              placeholder="Prompt text, passage, or notes…"
              rows={8}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="cursor-pointer inline-flex items-center gap-2"
              disabled={saveState === 'saving'}
              aria-busy={saveState === 'saving'}
              onClick={() => {
                void handleSubmit()
              }}
            >
              {saveState === 'saving' ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="size-4 shrink-0" aria-hidden />
                  Save to Firestore
                </>
              )}
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
            >
              {saveMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {firebaseReady ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Saved items</CardTitle>
                <CardDescription>
                  Newest first. Use this list to confirm inserts.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer inline-flex shrink-0 items-center gap-2"
                disabled={listLoading}
                aria-busy={listLoading}
                onClick={() => {
                  void loadList()
                }}
              >
                {listLoading ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4 shrink-0" aria-hidden />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {listError ? (
              <p className="text-sm text-destructive">{listError}</p>
            ) : null}
            {listLoading && items === null ? (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                Loading…
              </div>
            ) : null}
            {items !== null && items.length === 0 && !listLoading ? (
              <p className="text-sm text-muted-foreground">No documents yet.</p>
            ) : null}
            <ul className="flex max-h-[min(32rem,70vh)] flex-col gap-3 overflow-y-auto pr-1">
              {(items ?? []).map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-border bg-card p-3 text-sm shadow-sm"
                >
                  <p className="break-all font-mono text-[11px] text-muted-foreground">
                    id: {item.id}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatWhen(item)}</p>
                  <p className="mt-2 font-medium text-foreground">
                    {item.title.trim().length > 0 ? item.title : 'Untitled'}
                  </p>
                  <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
