import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

import { getStorageClient } from '@/lib/firebase'

const MAX_BYTES = 4 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
])

const MIME_TO_EXT: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export function validateTask1ImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Use PNG, JPEG, GIF, or WebP.'
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be at most 4 MB.'
  }
  return null
}

export async function uploadTask1PromptImage(userId: string, file: File) {
  const client = getStorageClient()
  if (!client) {
    throw new Error('Firebase Storage is not configured (check VITE_FIREBASE_STORAGE_BUCKET).')
  }
  const validationError = validateTask1ImageFile(file)
  if (validationError !== null) {
    throw new Error(validationError)
  }
  const ext = MIME_TO_EXT[file.type] ?? 'png'
  const objectPath = `writing-task1-images/${userId}/${crypto.randomUUID()}.${ext}`
  const storageRef = ref(client, objectPath)
  await uploadBytes(storageRef, file, {
    contentType: file.type,
  })
  return getDownloadURL(storageRef)
}
