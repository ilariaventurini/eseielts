import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
  )
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let storage: FirebaseStorage | undefined

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) {
    return undefined
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  }
  return app
}

export function getDb() {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) {
    return undefined
  }
  return getFirestore(firebaseApp)
}

export function getAuthClient() {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) {
    return undefined
  }
  if (!auth) {
    auth = getAuth(firebaseApp)
  }
  return auth
}

export function isFirebaseStorageConfigured() {
  return (
    hasFirebaseConfig() &&
    typeof firebaseConfig.storageBucket === 'string' &&
    firebaseConfig.storageBucket.length > 0
  )
}

export function getStorageClient() {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp || !isFirebaseStorageConfigured()) {
    return undefined
  }
  if (!storage) {
    storage = getStorage(firebaseApp)
  }
  return storage
}

export function isFirebaseConfigured() {
  return hasFirebaseConfig()
}
