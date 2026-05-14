import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore'

import { FIRESTORE_COLLECTIONS } from '@/constants/firestore.constants'
import { getDb } from '@/lib/firebase'
import type { SpeakingPrompt, SpeakingTask } from '@/types/speaking.types'

function normalizeTask(value: unknown): SpeakingTask {
  if (value === 1 || value === 2 || value === 3) {
    return value
  }
  return 1
}

function mapPrompt(id: string, data: DocumentData): SpeakingPrompt {
  return {
    id,
    task: normalizeTask(data.task),
    title: typeof data.title === 'string' ? data.title : '',
    body: typeof data.body === 'string' ? data.body : '',
    createdAt: data.createdAt ?? null,
  }
}

function promptCreatedMs(createdAt: SpeakingPrompt['createdAt']) {
  if (createdAt !== null && typeof createdAt.toMillis === 'function') {
    return createdAt.toMillis()
  }
  return 0
}

export async function createSpeakingPrompts(
  items: readonly { task: SpeakingTask; title: string; body: string }[],
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingPrompts)
  await Promise.all(
    items.map((item) =>
      addDoc(col, {
        task: item.task,
        title: item.title,
        body: item.body,
        createdAt: serverTimestamp(),
      }),
    ),
  )
}

/** All speaking prompts in Firestore, newest first (by `createdAt` when present). */
export async function fetchAllSpeakingPrompts() {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingPrompts)
  const snap = await getDocs(col)
  const prompts = snap.docs.map((doc) => mapPrompt(doc.id, doc.data()))
  return [...prompts].sort(
    (a, b) => promptCreatedMs(b.createdAt) - promptCreatedMs(a.createdAt),
  )
}

/** Prompts for a given speaking task, newest first. */
export async function fetchSpeakingPromptsByTask(task: SpeakingTask) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingPrompts)
  const q = query(col, where('task', '==', task))
  const snap = await getDocs(q)
  const prompts = snap.docs.map((doc) => mapPrompt(doc.id, doc.data()))
  return [...prompts].sort(
    (a, b) => promptCreatedMs(b.createdAt) - promptCreatedMs(a.createdAt),
  )
}
