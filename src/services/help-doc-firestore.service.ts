import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore'

import { isHelpDocTabId } from '@/constants/help-doc.constants'
import { FIRESTORE_COLLECTIONS } from '@/constants/firestore.constants'
import { getDb } from '@/lib/firebase'
import type { HelpDocRecord, HelpDocTabId } from '@/types/help-doc.types'

function mapHelpDoc(tabId: HelpDocTabId, data: DocumentData): HelpDocRecord {
  return {
    tabId,
    body: typeof data.body === 'string' ? data.body : '',
    updatedAt: data.updatedAt ?? null,
  }
}

export async function fetchHelpDoc(tabId: HelpDocTabId) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const ref = doc(db, FIRESTORE_COLLECTIONS.helpDocs, tabId)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    return null
  }
  return mapHelpDoc(tabId, snap.data())
}

export async function fetchHelpDocsBodyByTabId() {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.helpDocs)
  const snap = await getDocs(col)
  const bodies: Partial<Record<HelpDocTabId, string>> = {}
  snap.docs.forEach((item) => {
    if (!isHelpDocTabId(item.id)) {
      return
    }
    const body = typeof item.data().body === 'string' ? item.data().body : ''
    if (body.trim().length > 0) {
      bodies[item.id] = body
    }
  })
  return bodies
}

export async function upsertHelpDoc(tabId: HelpDocTabId, body: string) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const ref = doc(db, FIRESTORE_COLLECTIONS.helpDocs, tabId)
  await setDoc(
    ref,
    {
      body,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function seedHelpDocsFromDefaults(
  items: readonly { readonly tabId: HelpDocTabId; readonly body: string }[],
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  await Promise.all(
    items.map((item) => {
      const ref = doc(db, FIRESTORE_COLLECTIONS.helpDocs, item.tabId)
      return setDoc(
        ref,
        {
          body: item.body,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
    }),
  )
}
