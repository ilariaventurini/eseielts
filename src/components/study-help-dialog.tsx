import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StudyHelpMarkdown } from '@/components/study-help-markdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { STUDY_HELP_MARKDOWN } from '@/constants/study-help.markdown'
import { cn } from '@/lib/utils'

export function StudyHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5"
          aria-label="Open study tips for IELTS Writing"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'flex h-[92dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0'
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>Study tips</DialogTitle>
        </DialogHeader>
        <div className="text-foreground min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
          <StudyHelpMarkdown markdown={STUDY_HELP_MARKDOWN} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
