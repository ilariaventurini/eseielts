import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { STUDY_HELP_SECTIONS } from '@/constants/study-help.constants'
import { cn } from '@/lib/utils'

export function StudyHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="cursor-pointer gap-1.5">
          <BookOpen className="size-4 shrink-0" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'flex h-[85dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>Study tips — IELTS Writing</DialogTitle>
          <DialogDescription className="text-left">
            Reference notes for practice on this site. Scroll for more sections.
          </DialogDescription>
        </DialogHeader>
        <div className="text-foreground min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
          <div className="flex flex-col gap-6">
            {STUDY_HELP_SECTIONS.map((section) => (
              <section key={section.heading} className="flex flex-col gap-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {section.heading}
                </h3>
                <div className="flex flex-col gap-3">
                  {section.paragraphs.map((paragraph, i) => (
                    <p
                      key={`${section.heading}-${String(i)}`}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
