import { BookOpen, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

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
import { ROUTES } from '@/constants/routes.constants'
import { useHelpMarkdownTabs } from '@/hooks/use-help-markdown-tabs'
import { cn } from '@/lib/utils'

export interface HelpMarkdownDialogProps {
  readonly triggerAriaLabel: string
  readonly defaultTab?: string
  readonly dialogDescription?: string
  /** Shown only to assistive tech (required dialog label). */
  readonly dialogAccessibleName?: string
}

export function HelpMarkdownDialog({
  triggerAriaLabel,
  defaultTab = 'study-tips',
  dialogDescription = 'Tabbed help content. Use the tab list to switch sections.',
  dialogAccessibleName = 'Help documentation',
}: HelpMarkdownDialogProps) {
  const { tabs, loading, error, reload } = useHelpMarkdownTabs()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      void reload()
      setActiveTab(defaultTab)
      return
    }
    setActiveTab(defaultTab)
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
          <div className="flex shrink-0 flex-col gap-2 border-b px-4 py-2.5 pr-14 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
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
            <p className="text-xs text-muted-foreground">
              <Link
                to={ROUTES.helpDocsBackoffice}
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  handleOpenChange(false)
                }}
              >
                Edit help docs
              </Link>
              {loading ? (
                <span className="inline-flex items-center gap-1.5 pl-2">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Loading…
                </span>
              ) : null}
              {error ? (
                <span className="pl-2 text-destructive" role="alert">
                  {error} (showing bundled defaults)
                </span>
              ) : null}
            </p>
          </div>
          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="data-[state=inactive]:hidden m-0 flex min-h-0 flex-1 flex-col overflow-hidden outline-none"
            >
              <div className="text-foreground min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
                {loading ? (
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    Loading help content…
                  </div>
                ) : (
                  <StudyHelpMarkdown markdown={tab.markdown} />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function HelpDialog() {
  return (
    <HelpMarkdownDialog
      triggerAriaLabel="Open IELTS help (study tips and section guides)"
      defaultTab="study-tips"
      dialogAccessibleName="IELTS help"
      dialogDescription="IELTS help: study tips and guides for Listening, Reading, Writing, and Speaking."
    />
  )
}
