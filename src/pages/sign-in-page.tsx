import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ROUTES } from '@/constants/routes.constants'
import { useAuth } from '@/hooks/use-auth'
import { getAuthClient, isFirebaseConfigured } from '@/lib/firebase'

function mapAuthError(message: string) {
  if (message.includes('auth/popup-closed-by-user')) {
    return 'Sign-in was cancelled.'
  }
  if (message.includes('auth/popup-blocked')) {
    return 'The browser blocked the pop-up. Allow pop-ups for this site and try again.'
  }
  return message
}

export default function SignInPage() {
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firebaseReady = isFirebaseConfigured()

  useEffect(() => {
    if (!authLoading && user) {
      navigate(ROUTES.home, { replace: true })
    }
  }, [authLoading, user, navigate])

  async function handleGoogleSignIn() {
    const auth = getAuthClient()
    if (!auth) {
      setError(
        'Firebase Auth is not available. Check your environment variables.',
      )
      return
    }
    setError(null)
    setBusy(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
      navigate(ROUTES.home, { replace: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed'
      setError(mapAuthError(msg))
    } finally {
      setBusy(false)
    }
  }

  if (authLoading) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Checking session…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your Google account. Enable the Google provider in the Firebase
          console under Authentication → Sign-in method.
        </p>
      </div>

      {!firebaseReady ? (
        <p className="text-sm text-destructive">
          Firebase is not configured. Set VITE_FIREBASE_* in your{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code>{' '}
          file (including{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            VITE_FIREBASE_AUTH_DOMAIN
          </code>
          ).
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Google</CardTitle>
          <CardDescription>
            You will complete sign-in in a secure Google pop-up window.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            type="button"
            className="cursor-pointer w-fit"
            disabled={!firebaseReady || busy}
            onClick={() => {
              void handleGoogleSignIn()
            }}
          >
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button asChild variant="link" className="h-auto cursor-pointer p-0">
            <Link to={ROUTES.home}>Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
