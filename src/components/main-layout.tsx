import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router'

import { AppLogo } from '@/components/app-logo'
import { AuthToolbar } from '@/components/auth-toolbar'
import { HelpDialog } from '@/components/help-markdown-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  IELTS_SKILLS,
  ROUTES,
  skillRootPath,
  type IeltsSkill,
} from '@/constants/routes.constants'
import { cn } from '@/lib/utils'

function skillNavLabel(skill: IeltsSkill) {
  if (skill === 'listening') {
    return 'Listening'
  }
  if (skill === 'reading') {
    return 'Reading'
  }
  if (skill === 'writing') {
    return 'Writing'
  }
  return 'Speaking'
}

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
          'label-caps cursor-pointer border-b-2 border-transparent px-0 py-1 transition-colors',
          isActive
            ? 'border-accent-highlight text-accent-highlight'
            : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {children}
    </NavLink>
  )
}

function HomeNavLink() {
  return (
    <NavLink
      to={ROUTES.home}
      end
      aria-label="Home"
      className={({ isActive }) =>
        cn(
          'inline-flex cursor-pointer border-b-2 border-transparent p-0.5 transition-colors',
          isActive
            ? 'border-accent-highlight'
            : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      <AppLogo className="size-4" />
    </NavLink>
  )
}

export function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <nav
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            aria-label="Main navigation"
          >
            <HomeNavLink />
            {IELTS_SKILLS.map((skill) => (
              <ShellNavLink key={skill} to={skillRootPath(skill)} end={false}>
                {skillNavLabel(skill)}
              </ShellNavLink>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <AuthToolbar />
            <HelpDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        <Outlet />
      </div>
    </div>
  )
}
