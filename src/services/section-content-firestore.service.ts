import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'

import { FIRESTORE_COLLECTIONS } from '@/constants/firestore.constants'
import { getDb } from '@/lib/firebase'
import type { SectionContentItem, SectionContentSkill } from '@/types/section-content.types'

function collectionNameForSkill(skill: SectionContentSkill) {
  if (skill === 'listening') {
    return FIRESTORE_COLLECTIONS.listeningContent
  }
  if (skill === 'reading') {
    return FIRESTORE_COLLECTIONS.readingContent
  }
  return FIRESTORE_COLLECTIONS.speakingContent
}

function mapSectionContent(id: string, data: DocumentData): SectionContentItem {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    body: typeof data.body === 'string' ? data.body : '',
    createdAt: data.createdAt ?? null,
  }
}

export async function createSectionContentItem(
  skill: SectionContentSkill,
  payload: { readonly title: string; readonly body: string },
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const name = collectionNameForSkill(skill)
  const col = collection(db, name)
  await addDoc(col, {
    title: payload.title,
    body: payload.body,
    createdAt: serverTimestamp(),
  })
}

export async function fetchSectionContentItems(
  skill: SectionContentSkill,
  max = 80,
) {
  const db = getDb()
  if (!db) {
    throw new Error('Firebase is not configured.')
  }
  const name = collectionNameForSkill(skill)
  const col = collection(db, name)
  const q = query(col, orderBy('createdAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map((doc) => mapSectionContent(doc.id, doc.data()))
}
