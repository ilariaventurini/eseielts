import { ChevronDown, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WritingGeminiSolutionAccordionProps {
  readonly solution: string | null
  readonly loading: boolean
  readonly loadingLabel: string
  readonly error: string | null
  readonly disabled?: boolean
  readonly onGenerate: () => void
}

export function WritingGeminiSolutionAccordion({
  solution,
  loading,
  loadingLabel,
  error,
  disabled = false,
  onGenerate,
}: WritingGeminiSolutionAccordionProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const hasSolution = solution !== null && solution.trim().length > 0

  useEffect(() => {
    if (hasSolution && detailsRef.current !== null) {
      detailsRef.current.open = true
    }
  }, [hasSolution])

  return (
    <details
      ref={detailsRef}
      className="group rounded-sm border border-border/70 text-xs text-muted-foreground"
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-2',
          'hover:bg-muted/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          '[&::-webkit-details-marker]:hidden'
        )}
        aria-label="Toggle Gemini model answer"
      >
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[10px] font-medium tracking-wide uppercase">
            Gemini model answer
          </span>
          <span className="mt-0.5 block text-[10px] font-normal group-open:hidden">
            {hasSolution
              ? 'Expand to read the model answer alongside your draft'
              : 'Optional help — does not change your text'}
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 cursor-pointer"
            disabled={disabled || loading}
            aria-busy={loading}
            aria-label={loading ? loadingLabel : hasSolution ? 'Regenerate model answer' : 'Generate model answer'}
            title={loading ? loadingLabel : hasSolution ? 'Regenerate model answer' : 'Generate model answer'}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onGenerate()
            }}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : hasSolution ? (
              <RefreshCw className="size-3.5" aria-hidden />
            ) : (
              <Sparkles className="size-3.5" aria-hidden />
            )}
          </Button>
          <ChevronDown
            className="size-3.5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </div>
      </summary>
      <div className="flex flex-col gap-2 border-t border-border/70 px-2.5 pb-2.5 pt-2">
        {hasSolution ? (
          <div
            className="max-h-80 overflow-y-auto rounded-sm border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px] leading-relaxed whitespace-pre-wrap"
            role="region"
            aria-label="Gemini model answer"
          >
            {solution}
          </div>
        ) : null}

        {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      </div>
    </details>
  )
}
