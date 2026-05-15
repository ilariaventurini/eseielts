import { cn } from '@/lib/utils'
import {
  practiceTypologyLabel,
  type PracticeTypology,
} from '@/types/practice-typology.types'

interface PracticeTypologyBadgeProps {
  readonly value: PracticeTypology
  readonly className?: string
}

function badgeClass(value: PracticeTypology) {
  if (value === 'ai') {
    return 'bg-violet-500/15 text-violet-800 dark:text-violet-200'
  }
  if (value === 'edusogno_example') {
    return 'bg-amber-500/15 text-amber-950 dark:text-amber-100'
  }
  return 'bg-muted text-foreground'
}

export function PracticeTypologyBadge({ value, className }: PracticeTypologyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-medium',
        badgeClass(value),
        className,
      )}
    >
      {practiceTypologyLabel(value)}
    </span>
  )
}
