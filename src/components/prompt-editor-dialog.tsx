import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  PRACTICE_TYPOLOGY_OPTIONS,
  type PracticeTypology,
} from '@/types/practice-typology.types'

export interface PromptEditorValues {
  title: string
  task: number
  body: string
  practiceTypology: PracticeTypology
}

interface PromptEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillLabel: string
  taskOptions: readonly { readonly value: number; readonly label: string }[]
  initialValues: PromptEditorValues
  onSave: (values: PromptEditorValues) => Promise<void>
}

export function PromptEditorDialog({
  open,
  onOpenChange,
  skillLabel,
  taskOptions,
  initialValues,
  onSave,
}: PromptEditorDialogProps) {
  const [title, setTitle] = useState(initialValues.title)
  const [task, setTask] = useState(initialValues.task)
  const [body, setBody] = useState(initialValues.body)
  const [practiceTypology, setPracticeTypology] = useState(
    initialValues.practiceTypology,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = body.trim().length > 0 && !saving

  async function handleSave() {
    if (body.trim().length === 0) {
      setError('The prompt text is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        task,
        body: body.trim(),
        practiceTypology,
      })
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {skillLabel} prompt</DialogTitle>
          <DialogDescription>
            Update the title, task, practice type, and prompt text.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="prompt-editor-title">Title</Label>
          <Input
            id="prompt-editor-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 01 - Work"
            autoComplete="off"
            disabled={saving}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Task</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Task">
            {taskOptions.map((option) => (
              <Button
                key={String(option.value)}
                type="button"
                size="sm"
                variant={task === option.value ? 'default' : 'outline'}
                className="cursor-pointer"
                aria-pressed={task === option.value}
                disabled={saving}
                onClick={() => setTask(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Practice type</Label>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Practice type"
          >
            {PRACTICE_TYPOLOGY_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={practiceTypology === option.value ? 'default' : 'outline'}
                className="cursor-pointer"
                aria-pressed={practiceTypology === option.value}
                disabled={saving}
                onClick={() => setPracticeTypology(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="prompt-editor-body">Prompt text</Label>
          <Textarea
            id="prompt-editor-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            disabled={saving}
            aria-label="Prompt text"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer"
            disabled={!canSave}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
