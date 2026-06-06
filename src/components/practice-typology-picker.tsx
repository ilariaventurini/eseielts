import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PRACTICE_TYPOLOGY_OPTIONS, type PracticeTypology } from '@/types/practice-typology.types'

const PRACTICE_TYPOLOGY_LABEL_ID = 'practice-typology-label'

interface PracticeTypologyPickerProps {
  readonly value: PracticeTypology
  readonly onChange: (value: PracticeTypology) => void
  readonly disabled?: boolean
}

export function PracticeTypologyPicker({
  value,
  onChange,
  disabled = false,
}: PracticeTypologyPickerProps) {
  return (
    <fieldset
      disabled={disabled}
      aria-labelledby={PRACTICE_TYPOLOGY_LABEL_ID}
      className="m-0 flex w-full flex-row flex-wrap items-center justify-end gap-x-2 gap-y-0.5 border-0 p-0"
    >
      <span
        id={PRACTICE_TYPOLOGY_LABEL_ID}
        className="shrink-0 text-xs font-normal text-muted-foreground"
      >
        Practice type
      </span>
      {PRACTICE_TYPOLOGY_OPTIONS.map((opt) => {
        const isSelected = value === opt.value
        return (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 cursor-pointer px-2 text-xs font-normal',
              isSelected
                ? 'border border-foreground text-foreground hover:bg-transparent hover:text-foreground'
                : 'border border-transparent text-muted-foreground hover:bg-transparent hover:text-muted-foreground',
            )}
            aria-pressed={isSelected}
            onClick={() => {
              onChange(opt.value)
            }}
          >
            {opt.label}
          </Button>
        )
      })}
    </fieldset>
  )
}
