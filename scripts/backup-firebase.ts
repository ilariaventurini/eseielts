import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import admin from 'firebase-admin'

import { FIRESTORE_COLLECTIONS } from '../src/constants/firestore.constants.ts'

const STORAGE_PREFIX = 'writing-task1-images'
const BACKUPS_DIR = 'backups'

const FIRESTORE_COLLECTION_NAMES = Object.values(FIRESTORE_COLLECTIONS)

interface BackupManifest {
  createdAt: string
  projectId: string
  storageBucket: string
  firestore: Record<string, { documentCount: number }>
  storage: Record<string, { fileCount: number; totalBytes: number }>
}

function loadServiceAccount() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (jsonEnv) {
    return JSON.parse(jsonEnv) as admin.ServiceAccount
  }

  const credentialsPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()

  if (!credentialsPath) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH (or GOOGLE_APPLICATION_CREDENTIALS).',
    )
  }

  const absolutePath = path.isAbsolute(credentialsPath)
    ? credentialsPath
    : path.join(process.cwd(), credentialsPath)

  return readFile(absolutePath, 'utf8').then((raw) => JSON.parse(raw) as admin.ServiceAccount)
}

function resolveStorageBucket(projectId: string) {
  const fromEnv =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim()

  if (fromEnv) {
    return fromEnv
  }

  return `${projectId}.appspot.com`
}

function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString()
  }

  if (value instanceof admin.firestore.GeoPoint) {
    return {
      latitude: value.latitude,
      longitude: value.longitude,
    }
  }

  if (value instanceof admin.firestore.DocumentReference) {
    return { path: value.path }
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue)
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeFirestoreValue(nestedValue),
      ]),
    )
  }

  return value
}

function createBackupDirName() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

async function exportFirestoreCollection(
  db: admin.firestore.Firestore,
  collectionName: string,
  outputDir: string,
) {
  const snapshot = await db.collection(collectionName).get()
  const documents = snapshot.docs.map((doc) => ({
    id: doc.id,
    data: serializeFirestoreValue(doc.data()),
  }))

  const filePath = path.join(outputDir, `${collectionName}.json`)
  await writeFile(filePath, `${JSON.stringify(documents, null, 2)}\n`, 'utf8')

  return documents.length
}

async function exportStoragePrefix(
  bucket: ReturnType<admin.storage.Storage['bucket']>,
  prefix: string,
  outputDir: string,
) {
  const [files] = await bucket.getFiles({ prefix: `${prefix}/` })

  const totals = await Promise.all(
    files.map(async (file) => {
      const destination = path.join(outputDir, file.name)
      await mkdir(path.dirname(destination), { recursive: true })
      await file.download({ destination })

      const [metadata] = await file.getMetadata()
      const size = Number(metadata.size ?? 0)

      return Number.isFinite(size) ? size : 0
    }),
  )

  const totalBytes = totals.reduce((sum, size) => sum + size, 0)

  return {
    fileCount: files.length,
    totalBytes,
  }
}

async function runBackup() {
  const serviceAccount = await loadServiceAccount()
  const projectId = serviceAccount.projectId

  if (!projectId) {
    throw new Error('Service account JSON is missing project_id.')
  }

  const storageBucket = resolveStorageBucket(projectId)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
    storageBucket,
  })

  const db = admin.firestore()
  const bucket = admin.storage().bucket(storageBucket)
  const backupDirName = createBackupDirName()
  const backupRoot = path.join(process.cwd(), BACKUPS_DIR, backupDirName)
  const firestoreDir = path.join(backupRoot, 'firestore')
  const storageDir = path.join(backupRoot, 'storage')

  await mkdir(firestoreDir, { recursive: true })
  await mkdir(storageDir, { recursive: true })

  const firestoreCounts = Object.fromEntries(
    await Promise.all(
      FIRESTORE_COLLECTION_NAMES.map(async (collectionName) => {
        const documentCount = await exportFirestoreCollection(db, collectionName, firestoreDir)
        return [collectionName, { documentCount }] as const
      }),
    ),
  )

  const storageStats = await exportStoragePrefix(bucket, STORAGE_PREFIX, storageDir)

  const manifest: BackupManifest = {
    createdAt: new Date().toISOString(),
    projectId,
    storageBucket,
    firestore: firestoreCounts,
    storage: {
      [STORAGE_PREFIX]: storageStats,
    },
  }

  await writeFile(
    path.join(backupRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )

  const totalDocuments = Object.values(firestoreCounts).reduce(
    (sum, entry) => sum + entry.documentCount,
    0,
  )

  console.log(`Backup saved to ${backupRoot}`)
  console.log(`Firestore: ${totalDocuments} documents across ${FIRESTORE_COLLECTION_NAMES.length} collections`)
  console.log(`Storage: ${storageStats.fileCount} files (${storageStats.totalBytes} bytes)`)
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMainModule) {
  runBackup().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Backup failed: ${message}`)
    process.exitCode = 1
  })
}
