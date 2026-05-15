import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
} from 'firebase/firestore'

import { FIRESTORE_COLLECTIONS } from '@/constants/firestore.constants'
import { getDb } from '@/lib/firebase'
import { normalizePracticeTypology } from '@/types/practice-typology.types'
import type {
  SpeakingAttempt,
  SpeakingPrompt,
  SpeakingTask,
} from '@/types/speaking.types'

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
    practiceTypology: normalizePracticeTypology(data.practiceTypology),
    createdAt: data.createdAt ?? null,
  }
}

function promptCreatedMs(createdAt: SpeakingPrompt['createdAt']) {
  if (createdAt !== null && typeof createdAt.toMillis === 'function') {
    return createdAt.toMillis()
  }
  return 0
}

function mapSpeakingAttempt(id: string, data: DocumentData): SpeakingAttempt {
  return {
    id,
    promptId: typeof data.promptId === 'string' ? data.promptId : '',
    task: normalizeTask(data.task),
    promptTitle: typeof data.promptTitle === 'string' ? data.promptTitle : '',
    promptBody: typeof data.promptBody === 'string' ? data.promptBody : '',
    notes: typeof data.notes === 'string' ? data.notes : '',
    extendedTimerMs:
      typeof data.extendedTimerMs === 'number' ? data.extendedTimerMs : 0,
    practiceTypology: normalizePracticeTypology(data.practiceTypology),
    createdAt: data.createdAt ?? null,
  }
}

export async function createSpeakingPrompts(
  items: readonly {
    task: SpeakingTask
    title: string
    body: string
    practiceTypology: SpeakingPrompt['practiceTypology']
  }[],
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
        practiceTypology: item.practiceTypology,
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

export async function createSpeakingAttempt(payload: {
  promptId: string
  task: SpeakingTask
  promptTitle: string
  promptBody: string
  notes: string
  extendedTimerMs: number
  practiceTypology: SpeakingAttempt['practiceTypology']
}) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingAttempts)
  await addDoc(col, {
    promptId: payload.promptId,
    task: payload.task,
    promptTitle: payload.promptTitle,
    promptBody: payload.promptBody,
    notes: payload.notes,
    extendedTimerMs: payload.extendedTimerMs,
    practiceTypology: payload.practiceTypology,
    createdAt: serverTimestamp(),
  })
}

export async function fetchSpeakingAttempts(max = 80) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingAttempts)
  const q = query(col, orderBy('createdAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map((doc) => mapSpeakingAttempt(doc.id, doc.data()))
}
