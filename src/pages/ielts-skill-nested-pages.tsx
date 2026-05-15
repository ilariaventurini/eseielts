import { useParams } from 'react-router'

import { isIeltsSkill } from '@/constants/routes.constants'
import BackofficePage from '@/pages/backoffice-page'
import NotFoundPage from '@/pages/not-found-page'
import SpeakingBackofficePage from '@/pages/speaking-backoffice-page'
import SectionComingSoonPage from '@/pages/section-coming-soon-page'
import SectionContentBackofficePage from '@/pages/section-content-backoffice-page'
import SpeakingHistoryPage from '@/pages/speaking-history-page'
import SpeakingPage from '@/pages/speaking-page'
import WritingHistoryPage from '@/pages/writing-history-page'
import WritingPage from '@/pages/writing-page'

export function IeltsSkillExercisesPage() {
  const { skill } = useParams()
  if (!isIeltsSkill(skill)) {
    return <NotFoundPage />
  }
  if (skill === 'writing') {
    return <WritingPage />
  }
  if (skill === 'speaking') {
    return <SpeakingPage />
  }
  return <SectionComingSoonPage skill={skill} variant="exercises" />
}

export function IeltsSkillHistoryPage() {
  const { skill } = useParams()
  if (!isIeltsSkill(skill)) {
    return <NotFoundPage />
  }
  if (skill === 'writing') {
    return <WritingHistoryPage />
  }
  if (skill === 'speaking') {
    return <SpeakingHistoryPage />
  }
  return <SectionComingSoonPage skill={skill} variant="history" />
}

export function IeltsSkillBackofficePage() {
  const { skill } = useParams()
  if (!isIeltsSkill(skill)) {
    return <NotFoundPage />
  }
  if (skill === 'writing') {
    return <BackofficePage />
  }
  if (skill === 'speaking') {
    return <SpeakingBackofficePage />
  }
  return <SectionContentBackofficePage skill={skill} />
}

export { IeltsSkillPromptsLibraryPage } from '@/pages/ielts-skill-prompts-library-page'
