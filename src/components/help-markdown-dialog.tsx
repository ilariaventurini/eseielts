import { BookOpen } from 'lucide-react'
import { useState } from 'react'

import { StudyHelpMarkdown } from '@/components/study-help-markdown'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  IELTS_LISTENING_TAB_MARKDOWN,
  IELTS_READING_TAB_MARKDOWN,
  IELTS_SPEAKING_TAB_MARKDOWN,
  IELTS_WRITING_STUDY_TIPS_TAB_MARKDOWN,
  IELTS_WRITING_TAB_MARKDOWN,
} from '@/constants/writing-help.markdown'
import { cn } from '@/lib/utils'

export interface HelpMarkdownTab {
  readonly value: string
  readonly label: string
  readonly markdown: string
}

export interface HelpMarkdownDialogProps {
  readonly triggerAriaLabel: string
  readonly tabs: readonly HelpMarkdownTab[]
  readonly defaultTab?: string
  readonly dialogDescription?: string
  /** Shown only to assistive tech (required dialog label). */
  readonly dialogAccessibleName?: string
}

export function HelpMarkdownDialog({
  triggerAriaLabel,
  tabs,
  defaultTab,
  dialogDescription = 'Tabbed help content. Use the tab list to switch sections.',
  dialogAccessibleName = 'Help documentation',
}: HelpMarkdownDialogProps) {
  const fallbackFirst = tabs[0]?.value ?? ''
  const resolvedDefault = defaultTab ?? fallbackFirst
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(resolvedDefault)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setActiveTab(resolvedDefault)
    }
  }

  if (tabs.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5"
          aria-label={triggerAriaLabel}
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'flex h-[92dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0'
        )}
      >
        <DialogTitle className="sr-only">{dialogAccessibleName}</DialogTitle>
        <DialogDescription className="sr-only">{dialogDescription}</DialogDescription>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="text-foreground flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <div className="flex shrink-0 items-center border-b px-4 py-2.5 pr-14 sm:px-6">
            <TabsList
              aria-label="Help sections"
              className="min-w-0 flex-1 sm:flex-initial sm:w-auto"
            >
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="data-[state=inactive]:hidden m-0 flex min-h-0 flex-1 flex-col overflow-hidden outline-none"
            >
              <div className="text-foreground min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
                <StudyHelpMarkdown markdown={tab.markdown} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

const IELTS_HELP_TABS: readonly HelpMarkdownTab[] = [
  {
    value: 'study-tips',
    label: 'Study tips',
    markdown: IELTS_WRITING_STUDY_TIPS_TAB_MARKDOWN,
  },
  {
    value: 'ielts-listening',
    label: '1. IELTS Listening',
    markdown: IELTS_LISTENING_TAB_MARKDOWN,
  },
  {
    value: 'ielts-reading',
    label: '2. IELTS Reading',
    markdown: IELTS_READING_TAB_MARKDOWN,
  },
  {
    value: 'ielts-writing',
    label: '3. IELTS Writing',
    markdown: IELTS_WRITING_TAB_MARKDOWN,
  },
  {
    value: 'ielts-speaking',
    label: '4. IELTS Speaking',
    markdown: IELTS_SPEAKING_TAB_MARKDOWN,
  },
]

export function HelpDialog() {
  return (
    <HelpMarkdownDialog
      triggerAriaLabel="Open IELTS help (study tips and section guides)"
      tabs={IELTS_HELP_TABS}
      defaultTab="study-tips"
      dialogAccessibleName="IELTS help"
      dialogDescription="IELTS help: study tips and guides for Listening, Reading, Writing, and Speaking."
    />
  )
}
