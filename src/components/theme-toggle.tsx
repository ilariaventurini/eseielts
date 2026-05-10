import { useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { STORAGE_KEYS } from '@/constants/storage.constants'

interface ThemeToggleProps {
  readonly className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  function setTheme(next: 'light' | 'dark') {
    const root = document.documentElement
    if (next === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEYS.theme, next)
    setIsDark(next === 'dark')
  }

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }
    event.preventDefault()
    toggleTheme()
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
    >
      {isDark ? '☀' : '☽'}
    </Button>
  )
}
