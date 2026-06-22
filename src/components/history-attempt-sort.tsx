import { ArrowDownUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  HISTORY_SORT_OPTIONS,
  type HistorySortKey,
} from '@/constants/history-sort.constants'
import { cn } from '@/lib/utils'

interface HistoryAttemptSortProps {
  readonly sortKey: HistorySortKey
  readonly onSortKeyChange: (value: HistorySortKey) => void
}

const sortButtonClass =
  'h-7 min-h-7 px-2 text-xs font-medium has-[>svg]:px-1.5 [&_svg]:size-3'

export function HistoryAttemptSort({
  sortKey,
  onSortKeyChange,
}: HistoryAttemptSortProps) {
  return (
    <section
      className="rounded-sm border border-border p-3"
      aria-label="Sort attempts"
    >
      <fieldset className="m-0 space-y-2 border-0 p-0">
        <legend className="flex items-center gap-2 text-xs font-semibold tracking-wide text-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-foreground">
            <ArrowDownUp className="size-4" aria-hidden />
          </span>
          Sort by
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {HISTORY_SORT_OPTIONS.map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant={sortKey === key ? 'default' : 'outline'}
              className={cn('cursor-pointer', sortButtonClass)}
              aria-pressed={sortKey === key}
              onClick={() => {
                onSortKeyChange(key)
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </fieldset>
    </section>
  )
}
