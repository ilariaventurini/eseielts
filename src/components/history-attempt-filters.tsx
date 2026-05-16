import { ChevronDown, Filter } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  formatBandFilterLabel,
  WRITING_BAND_FILTER_VALUES,
  type WritingBandFilter,
} from '@/constants/history-filters.constants'
import { cn } from '@/lib/utils'
import { PRACTICE_TYPOLOGY_OPTIONS } from '@/types/practice-typology.types'
import type { HistoryTaskFilter, HistoryTypologyFilter } from '@/utils/history-filters.utils'

interface TaskFilterOption {
  readonly key: HistoryTaskFilter
  readonly label: string
}

interface HistoryAttemptFiltersProps {
  readonly taskFilter: HistoryTaskFilter
  readonly onTaskFilterChange: (value: HistoryTaskFilter) => void
  readonly taskOptions: readonly TaskFilterOption[]
  readonly typologyFilter: HistoryTypologyFilter
  readonly onTypologyFilterChange: (value: HistoryTypologyFilter) => void
  readonly bandFilter?: WritingBandFilter
  readonly onBandFilterChange?: (value: WritingBandFilter) => void
}

const filterButtonClass =
  'h-7 min-h-7 px-2 text-xs font-medium has-[>svg]:px-1.5 [&_svg]:size-3'

function FilterButtonGroup({
  legend,
  children,
}: {
  readonly legend: string
  readonly children: ReactNode
}) {
  return (
    <fieldset className="m-0 space-y-2 border-0 p-0">
      <legend className="text-xs font-semibold tracking-wide text-foreground">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  )
}

function FilterButton({
  label,
  pressed,
  onClick,
}: {
  readonly label: string
  readonly pressed: boolean
  readonly onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={pressed ? 'default' : 'outline'}
      className={cn('cursor-pointer', filterButtonClass)}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

export function HistoryAttemptFilters({
  taskFilter,
  onTaskFilterChange,
  taskOptions,
  typologyFilter,
  onTypologyFilterChange,
  bandFilter,
  onBandFilterChange,
}: HistoryAttemptFiltersProps) {
  const showBand = bandFilter !== undefined && onBandFilterChange !== undefined

  return (
    <section
      className={cn(
        'rounded-lg border-2 border-primary/30 bg-muted/50 p-4 shadow-md',
        'ring-1 ring-primary/15',
      )}
      aria-label="Filter attempts"
    >
      <details className="group">
        <summary
          className={cn(
            'flex cursor-pointer list-none items-center justify-between gap-3',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            '[&::-webkit-details-marker]:hidden',
          )}
          aria-label="Toggle filters"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Filter className="size-4" aria-hidden />
            </span>
            <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="mt-4 flex flex-col gap-4 border-t border-border/80 pt-4">
          <FilterButtonGroup legend="Task">
            {taskOptions.map(({ key, label }) => (
              <FilterButton
                key={String(key)}
                label={label}
                pressed={taskFilter === key}
                onClick={() => {
                  onTaskFilterChange(key)
                }}
              />
            ))}
          </FilterButtonGroup>

          <FilterButtonGroup legend="Type">
            <FilterButton
              label="All"
              pressed={typologyFilter === 'all'}
              onClick={() => {
                onTypologyFilterChange('all')
              }}
            />
            {PRACTICE_TYPOLOGY_OPTIONS.map((opt) => (
              <FilterButton
                key={opt.value}
                label={opt.label}
                pressed={typologyFilter === opt.value}
                onClick={() => {
                  onTypologyFilterChange(opt.value)
                }}
              />
            ))}
          </FilterButtonGroup>

          {showBand ? (
            <FilterButtonGroup legend="Band score">
              <FilterButton
                label="All"
                pressed={bandFilter === 'all'}
                onClick={() => {
                  onBandFilterChange('all')
                }}
              />
              {WRITING_BAND_FILTER_VALUES.map((band) => (
                <FilterButton
                  key={String(band)}
                  label={formatBandFilterLabel(band)}
                  pressed={bandFilter === band}
                  onClick={() => {
                    onBandFilterChange(band)
                  }}
                />
              ))}
            </FilterButtonGroup>
          ) : null}
        </div>
      </details>
    </section>
  )
}
