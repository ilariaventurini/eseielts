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
import type {
  WritingAttempt,
  WritingPrompt,
  WritingTask,
} from '@/types/writing.types'

function mapPrompt(id: string, data: DocumentData): WritingPrompt {
  const rawImage =
    typeof data.imageUrl === 'string' ? data.imageUrl.trim() : ''
  return {
    id,
    task: data.task as WritingTask,
    imageUrl: rawImage.length > 0 ? rawImage : null,
    title: typeof data.title === 'string' ? data.title : '',
    body: typeof data.body === 'string' ? data.body : '',
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
    createdAt: data.createdAt ?? null,
  }
}

export async function createWritingPrompts(
  items: readonly {
    task: WritingTask
    title: string
    body: string
    imageUrl: string | null
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
        createdAt: serverTimestamp(),
      }),
    ),
  )
}

export async function fetchRandomWritingPrompt(task: WritingTask) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.writingPrompts)
  const q = query(col, where('task', '==', task))
  const snap = await getDocs(q)
  const prompts = snap.docs.map((doc) => mapPrompt(doc.id, doc.data()))
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
}) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const col = collection(db, FIRESTORE_COLLECTIONS.writingAttempts)
  await addDoc(col, {
    ...payload,
    createdAt: serverTimestamp(),
  })
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
