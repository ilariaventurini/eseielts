import { useParams } from 'react-router'

import { isIeltsSkill } from '@/constants/routes.constants'
import NotFoundPage from '@/pages/not-found-page'
import SpeakingPromptsLibraryPage from '@/pages/speaking-prompts-library-page'
import WritingPromptsLibraryPage from '@/pages/writing-prompts-library-page'

function PromptsLibraryComingSoonPage() {
  return (
    <div className="flex flex-col gap-2 text-left">
      <h1 className="text-2xl font-semibold tracking-tight">Prompts library</h1>
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Coming soon for this paper.
      </p>
    </div>
  )
}

export function IeltsSkillPromptsLibraryPage() {
  const { skill } = useParams()
  if (!isIeltsSkill(skill)) {
    return <NotFoundPage />
  }
  if (skill === 'writing') {
    return <WritingPromptsLibraryPage />
  }
  if (skill === 'speaking') {
    return <SpeakingPromptsLibraryPage />
  }
  return <PromptsLibraryComingSoonPage />
}
