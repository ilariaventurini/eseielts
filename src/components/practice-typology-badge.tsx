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
    return 'border-accent-highlight/40 bg-muted text-accent-highlight'
  }
  return 'border-border bg-muted text-foreground'
}

export function PracticeTypologyBadge({ value, className }: PracticeTypologyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-sm border px-2 py-0.5 text-xs font-medium',
        badgeClass(value),
        className,
      )}
    >
      {practiceTypologyLabel(value)}
    </span>
  )
}
