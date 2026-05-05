import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'

import { AuthContext } from '@/contexts/auth-context'
import { getAuthClient, isFirebaseConfigured } from '@/lib/firebase'

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const firebaseReady = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(firebaseReady)

  useEffect(() => {
    if (!firebaseReady) {
      return
    }
    const client = getAuthClient()
    if (!client) {
      return
    }
    const unsubscribe = onAuthStateChanged(client, (nextUser) => {
      setUser(nextUser)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [firebaseReady])

  return (
    <AuthContext.Provider value={{ user, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
