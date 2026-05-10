import { signOut } from 'firebase/auth'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes.constants'
import { useAuth } from '@/hooks/use-auth'
import { getAuthClient } from '@/lib/firebase'

export function AuthToolbar() {
  const { user, authLoading } = useAuth()

  async function handleSignOut() {
    const auth = getAuthClient()
    if (!auth) {
      return
    }
    await signOut(auth)
  }

  if (authLoading) {
    return (
      <span className="text-xs text-muted-foreground" aria-live="polite">
        …
      </span>
    )
  }

  if (user) {
    const label = user.displayName ?? user.email ?? 'Signed in'
    return (
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <span
          className="max-w-40 truncate text-xs text-muted-foreground sm:max-w-[12rem]"
          title={user.email ?? undefined}
        >
          {label}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer shrink-0"
          onClick={() => {
            void handleSignOut()
          }}
        >
          ➜]
        </Button>
      </div>
    )
  }

  return (
    <Button asChild variant="outline" size="sm" className="cursor-pointer">
      <Link to={ROUTES.signIn}>Sign in</Link>
    </Button>
  )
}
