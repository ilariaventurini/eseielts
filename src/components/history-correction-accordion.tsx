import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

interface HistoryCorrectionAccordionProps {
  readonly correction: string
}

function correctionPreview(text: string) {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return 'No correction saved'
  }
  if (trimmed.length > 80) {
    return `${trimmed.slice(0, 80)}…`
  }
  return trimmed
}

export function HistoryCorrectionAccordion({ correction }: HistoryCorrectionAccordionProps) {
  const trimmed = correction.trim()
  const preview = correctionPreview(correction)

  return (
    <details className="group rounded-sm border border-border">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5',
          'text-sm font-medium text-foreground',
          'hover:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          '[&::-webkit-details-marker]:hidden',
        )}
        aria-label="Toggle correction"
      >
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Correction
          </span>
          <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground group-open:hidden">
            {preview}
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-border px-3 pb-3 pt-2 text-sm whitespace-pre-wrap text-muted-foreground">
        {trimmed.length > 0 ? correction : '—'}
      </div>
    </details>
  )
}
