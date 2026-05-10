import type { ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { AuthToolbar } from '@/components/auth-toolbar'
import { StudyHelpDialog } from '@/components/study-help-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { ROUTES } from '@/constants/routes.constants'
import { cn } from '@/lib/utils'

function ShellNavLink({
  to,
  end,
  children,
}: {
  readonly to: string
  readonly end?: boolean
  readonly children: ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'cursor-pointer px-2',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="cursor-pointer font-semibold">
              <Link to={ROUTES.home}>⌂</Link>
            </Button>
            <ShellNavLink to={ROUTES.backoffice}>Backoffice</ShellNavLink>
            <ShellNavLink to={ROUTES.writing} end>
              Writing
            </ShellNavLink>
            <ShellNavLink to={ROUTES.writingHistory}>History</ShellNavLink>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <AuthToolbar />
            <StudyHelpDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </div>
    </div>
  )
}
