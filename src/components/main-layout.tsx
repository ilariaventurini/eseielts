import type { ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { AuthToolbar } from '@/components/auth-toolbar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
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
    <Button asChild variant="ghost" size="sm" className="cursor-pointer px-2">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            isActive
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )
        }
      >
        {children}
      </NavLink>
    </Button>
  )
}

export function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="cursor-pointer font-semibold"
            >
              <Link to={ROUTES.home}>eseielts</Link>
            </Button>
            <ShellNavLink to={ROUTES.backoffice}>Backoffice</ShellNavLink>
            <ShellNavLink to={ROUTES.writing} end>
              Writing
            </ShellNavLink>
            <ShellNavLink to={ROUTES.writingHistory}>History</ShellNavLink>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <AuthToolbar />
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
