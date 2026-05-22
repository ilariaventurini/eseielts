import { useCallback, useEffect, useMemo, useState } from 'react'

import { IELTS_HELP_DOC_TAB_DEFINITIONS } from '@/constants/help-doc.constants'
import { useAuth } from '@/hooks/use-auth'
import { isFirebaseConfigured } from '@/lib/firebase'
import { fetchHelpDocsBodyByTabId } from '@/services/help-doc-firestore.service'
import type { HelpDocTabId } from '@/types/help-doc.types'

export interface HelpMarkdownTab {
  readonly value: HelpDocTabId
  readonly label: string
  readonly markdown: string
  readonly source: 'firestore' | 'bundled'
}

export function useHelpMarkdownTabs() {
  const { user, authLoading } = useAuth()
  const firebaseReady = isFirebaseConfigured()
  const canLoadFromFirestore = firebaseReady && !authLoading && user !== null
  const [firestoreBodies, setFirestoreBodies] = useState<
    Partial<Record<HelpDocTabId, string>> | null
  >(null)
  const [loading, setLoading] = useState(canLoadFromFirestore)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!canLoadFromFirestore) {
      setFirestoreBodies(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const bodies = await fetchHelpDocsBodyByTabId()
      setFirestoreBodies(bodies)
    } catch (e) {
      setFirestoreBodies({})
      setError(e instanceof Error ? e.message : 'Failed to load help docs')
    } finally {
      setLoading(false)
    }
  }, [canLoadFromFirestore])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load()
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [load])

  const tabs = useMemo((): readonly HelpMarkdownTab[] => {
    return IELTS_HELP_DOC_TAB_DEFINITIONS.map((def) => {
      const override = firestoreBodies?.[def.tabId]
      if (override !== undefined) {
        return {
          value: def.tabId,
          label: def.label,
          markdown: override,
          source: 'firestore' as const,
        }
      }
      return {
        value: def.tabId,
        label: def.label,
        markdown: def.defaultMarkdown,
        source: 'bundled' as const,
      }
    })
  }, [firestoreBodies])

  return { tabs, loading, error, reload: load, firebaseReady, canLoadFromFirestore }
}
