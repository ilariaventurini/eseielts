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
import type {
  WritingAttempt,
  WritingPrompt,
  WritingTask,
} from '@/types/writing.types'
import { countWords } from '@/utils/word-count.utils'

function mapPrompt(id: string, data: DocumentData): WritingPrompt {
  const rawImage =
    typeof data.imageUrl === 'string' ? data.imageUrl.trim() : ''
  return {
    id,
    task: data.task as WritingTask,
    imageUrl: rawImage.length > 0 ? rawImage : null,
    title: typeof data.title === 'string' ? data.title : '',
    body: typeof data.body === 'string' ? data.body : '',
    practiceTypology: normalizePracticeTypology(data.practiceTypology),
    createdAt: data.createdAt ?? null,
  }
}

function mapAttempt(id: string, data: DocumentData): WritingAttempt {
  const rawPromptImage =
    typeof data.promptImageUrl === 'string' ? data.promptImageUrl.trim() : ''
  return {
    id,
    promptId: typeof data.promptId === 'string' ? data.promptId : '',
    task: data.task as WritingTask,
    promptTitle: typeof data.promptTitle === 'string' ? data.promptTitle : '',
    promptBody: typeof data.promptBody === 'string' ? data.promptBody : '',
    promptImageUrl: rawPromptImage.length > 0 ? rawPromptImage : null,
    answer: typeof data.answer === 'string' ? data.answer : '',
    wordCount: typeof data.wordCount === 'number' ? data.wordCount : 0,
    durationMs: typeof data.durationMs === 'number' ? data.durationMs : 0,
    feedback: data.feedback as WritingAttempt['feedback'],
    rawModelText:
      typeof data.rawModelText === 'string' ? data.rawModelText : '',
    practiceTypology: normalizePracticeTypology(data.practiceTypology),
    createdAt: data.createdAt ?? null,
  }
}

export async function createWritingPrompts(
  items: readonly {
    task: WritingTask
    title: string
    body: string
    imageUrl: string | null
    practiceTypology: WritingPrompt['practiceTypology']
  }[],
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.writingPrompts)
  await Promise.all(
    items.map((item) =>
      addDoc(col, {
        task: item.task,
        title: item.title,
        body: item.body,
        imageUrl: item.imageUrl,
        practiceTypology: item.practiceTypology,
        createdAt: serverTimestamp(),
      }),
    ),
  )
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
 * Update the editable fields of a writing prompt (image is left unchanged) and
 * keep the snapshot stored on its attempts in sync (task, promptTitle,
 * promptBody). Per-attempt fields like `answer` and `practiceTypology` are
 * intentionally left untouched.
 */
export async function updateWritingPrompt(
  id: string,
  patch: {
    task: WritingTask
    title: string
    body: string
    practiceTypology: WritingPrompt['practiceTypology']
  },
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const ref = doc(db, FIRESTORE_COLLECTIONS.writingPrompts, id)
  await updateDoc(ref, {
    task: patch.task,
    title: patch.title,
    body: patch.body,
    practiceTypology: patch.practiceTypology,
  })
  const attemptsCol = collection(db, FIRESTORE_COLLECTIONS.writingAttempts)
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

/** Delete a single writing attempt (the exercise) without touching its prompt. */
export async function deleteWritingAttempt(id: string) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.writingAttempts, id))
}

/**
 * Delete a writing prompt together with every attempt linked to it.
 * Returns the number of associated attempts that were removed.
 */
export async function deleteWritingPromptWithAttempts(id: string) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const attemptsCol = collection(db, FIRESTORE_COLLECTIONS.writingAttempts)
  const attemptsSnap = await getDocs(query(attemptsCol, where('promptId', '==', id)))
  const refs = [
    ...attemptsSnap.docs.map((d) => d.ref),
    doc(db, FIRESTORE_COLLECTIONS.writingPrompts, id),
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

function writingPromptCreatedMs(createdAt: WritingPrompt['createdAt']) {
  if (createdAt !== null && typeof createdAt.toMillis === 'function') {
    return createdAt.toMillis()
  }
  return 0
}

/** All prompts in Firestore, newest first (by `createdAt` when present). */
export async function fetchAllWritingPrompts() {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.writingPrompts)
  const snap = await getDocs(col)
  const prompts = snap.docs.map((doc) => mapPrompt(doc.id, doc.data()))
  return [...prompts].sort(
    (a, b) => writingPromptCreatedMs(b.createdAt) - writingPromptCreatedMs(a.createdAt),
  )
}

/** All prompts for a given task, newest first (by `createdAt` when present). */
export async function fetchWritingPromptsByTask(task: WritingTask) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.writingPrompts)
  const q = query(col, where('task', '==', task))
  const snap = await getDocs(q)
  const prompts = snap.docs.map((doc) => mapPrompt(doc.id, doc.data()))
  return [...prompts].sort(
    (a, b) => writingPromptCreatedMs(b.createdAt) - writingPromptCreatedMs(a.createdAt),
  )
}

export async function fetchRandomWritingPrompt(task: WritingTask) {
  const prompts = await fetchWritingPromptsByTask(task)
  if (prompts.length === 0) {
    return null
  }
  const idx = Math.floor(Math.random() * prompts.length)
  return prompts[idx] ?? null
}

export async function createWritingAttempt(payload: {
  promptId: string
  task: WritingTask
  promptTitle: string
  promptBody: string
  promptImageUrl: string | null
  answer: string
  wordCount: number
  durationMs: number
  feedback: WritingAttempt['feedback']
  rawModelText: string
  practiceTypology: WritingAttempt['practiceTypology']
}) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.writingAttempts)
  await addDoc(col, {
    promptId: payload.promptId,
    task: payload.task,
    promptTitle: payload.promptTitle,
    promptBody: payload.promptBody,
    promptImageUrl: payload.promptImageUrl,
    answer: payload.answer,
    wordCount: payload.wordCount,
    durationMs: payload.durationMs,
    feedback: payload.feedback,
    rawModelText: payload.rawModelText,
    practiceTypology: payload.practiceTypology,
    createdAt: serverTimestamp(),
  })
}

/**
 * Update the answer text of an existing writing attempt.
 * Recomputes `wordCount` to keep it consistent with the edited answer.
 * Returns the new word count so callers can sync local state.
 */
export async function updateWritingAttemptAnswer(id: string, answer: string) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const wordCount = countWords(answer)
  const ref = doc(db, FIRESTORE_COLLECTIONS.writingAttempts, id)
  await updateDoc(ref, { answer, wordCount })
  return wordCount
}

export async function fetchWritingAttempts(max = 50) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.writingAttempts)
  const q = query(col, orderBy('createdAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map((doc) => mapAttempt(doc.id, doc.data()))
}
