import { Button } from '@/components/ui/button'
import {
  PRACTICE_TYPOLOGY_OPTIONS,
  type PracticeTypology,
} from '@/types/practice-typology.types'

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
    <fieldset disabled={disabled} className="m-0 space-y-2 border-0 p-0">
      <legend className="mb-2 text-sm font-medium text-foreground">Practice type</legend>
      <div className="flex flex-wrap gap-2">
        {PRACTICE_TYPOLOGY_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={value === opt.value ? 'default' : 'outline'}
            className="cursor-pointer"
            aria-pressed={value === opt.value}
            onClick={() => {
              onChange(opt.value)
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
