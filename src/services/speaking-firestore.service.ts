import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'

import { FIRESTORE_COLLECTIONS } from '@/constants/firestore.constants'
import { getDb } from '@/lib/firebase'
import { normalizePracticeTypology } from '@/types/practice-typology.types'
import type { SpeakingAttempt, SpeakingPrompt, SpeakingTask } from '@/types/speaking.types'

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
    extendedTimerMs: typeof data.extendedTimerMs === 'number' ? data.extendedTimerMs : 0,
    practiceTypology: normalizePracticeTypology(data.practiceTypology),
    createdAt: data.createdAt ?? null,
  }
}

const SPEAKING_PROMPT_BATCH_SIZE = 500
const SPEAKING_ATTEMPT_BATCH_SIZE = 500

export async function createSpeakingPrompts(
  items: readonly {
    task: SpeakingTask
    title: string
    body: string
    practiceTypology: SpeakingPrompt['practiceTypology']
  }[]
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingPrompts)
  const createdIds: string[] = []

  for (let offset = 0; offset < items.length; offset += SPEAKING_PROMPT_BATCH_SIZE) {
    const chunk = items.slice(offset, offset + SPEAKING_PROMPT_BATCH_SIZE)
    const batch = writeBatch(db)
    chunk.forEach((item) => {
      const ref = doc(col)
      createdIds.push(ref.id)
      batch.set(ref, {
        task: item.task,
        title: item.title,
        body: item.body,
        practiceTypology: item.practiceTypology,
        createdAt: serverTimestamp(),
      })
    })
    await batch.commit()
  }

  return createdIds
}

export async function createSpeakingAttempts(
  items: readonly {
    promptId: string
    task: SpeakingTask
    promptTitle: string
    promptBody: string
    notes: string
    extendedTimerMs: number
    practiceTypology: SpeakingAttempt['practiceTypology']
  }[]
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingAttempts)

  for (let offset = 0; offset < items.length; offset += SPEAKING_ATTEMPT_BATCH_SIZE) {
    const chunk = items.slice(offset, offset + SPEAKING_ATTEMPT_BATCH_SIZE)
    const batch = writeBatch(db)
    chunk.forEach((item) => {
      batch.set(doc(col), {
        promptId: item.promptId,
        task: item.task,
        promptTitle: item.promptTitle,
        promptBody: item.promptBody,
        notes: item.notes,
        extendedTimerMs: item.extendedTimerMs,
        practiceTypology: item.practiceTypology,
        createdAt: serverTimestamp(),
      })
    })
    await batch.commit()
  }
}

/** Split an array into chunks of at most `size` items (functional, no for-loops). */
function chunk<T>(items: readonly T[], size: number) {
  return items.reduce<T[][]>((acc, item, index) => {
    if (index % size === 0) {
      acc.push([])
    }
    acc[acc.length - 1].push(item)
    return acc
  }, [])
}

/**
 * Update the editable fields of a speaking prompt and keep the snapshot stored
 * on its attempts in sync (task, promptTitle, promptBody). Per-attempt fields
 * like `notes` and `practiceTypology` are intentionally left untouched.
 */
export async function updateSpeakingPrompt(
  id: string,
  patch: {
    task: SpeakingTask
    title: string
    body: string
    practiceTypology: SpeakingPrompt['practiceTypology']
  },
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const ref = doc(db, FIRESTORE_COLLECTIONS.speakingPrompts, id)
  await updateDoc(ref, {
    task: patch.task,
    title: patch.title,
    body: patch.body,
    practiceTypology: patch.practiceTypology,
  })
  const attemptsCol = collection(db, FIRESTORE_COLLECTIONS.speakingAttempts)
  const attemptsSnap = await getDocs(query(attemptsCol, where('promptId', '==', id)))
  if (attemptsSnap.size > 0) {
    await chunk(attemptsSnap.docs, 500).reduce(async (prev, group) => {
      await prev
      const batch = writeBatch(db)
      group.forEach((d) => {
        batch.update(d.ref, {
          task: patch.task,
          promptTitle: patch.title,
          promptBody: patch.body,
        })
      })
      await batch.commit()
    }, Promise.resolve())
  }
}

/** Delete a single speaking attempt (the exercise) without touching its prompt. */
export async function deleteSpeakingAttempt(id: string) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.speakingAttempts, id))
}

/**
 * Delete a speaking prompt together with every attempt linked to it.
 * Returns the number of associated attempts that were removed.
 */
export async function deleteSpeakingPromptWithAttempts(id: string) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const attemptsCol = collection(db, FIRESTORE_COLLECTIONS.speakingAttempts)
  const attemptsSnap = await getDocs(query(attemptsCol, where('promptId', '==', id)))
  const refs = [
    ...attemptsSnap.docs.map((d) => d.ref),
    doc(db, FIRESTORE_COLLECTIONS.speakingPrompts, id),
  ]
  await chunk(refs, 500).reduce(async (prev, group) => {
    await prev
    const batch = writeBatch(db)
    group.forEach((ref) => {
      batch.delete(ref)
    })
    await batch.commit()
  }, Promise.resolve())
  return attemptsSnap.size
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
  return [...prompts].sort((a, b) => promptCreatedMs(b.createdAt) - promptCreatedMs(a.createdAt))
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
  return [...prompts].sort((a, b) => promptCreatedMs(b.createdAt) - promptCreatedMs(a.createdAt))
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

/** Update the notes text of an existing speaking attempt. */
export async function updateSpeakingAttemptNotes(id: string, notes: string) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const ref = doc(db, FIRESTORE_COLLECTIONS.speakingAttempts, id)
  await updateDoc(ref, { notes })
}

export async function fetchSpeakingAttempts(max?: number) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.speakingAttempts)
  const q =
    max !== undefined
      ? query(col, orderBy('createdAt', 'desc'), limit(max))
      : query(col, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((doc) => mapSpeakingAttempt(doc.id, doc.data()))
}
