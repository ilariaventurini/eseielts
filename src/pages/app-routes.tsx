import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { IeltsSkillLayout } from '@/components/ielts-skill-layout'
import { MainLayout } from '@/components/main-layout'
import { ROUTE_SEGMENTS, ROUTES } from '@/constants/routes.constants'
import HomePage from '@/pages/home-page'
import IeltsSkillHubPage from '@/pages/ielts-skill-hub-page'
import {
  IeltsSkillBackofficePage,
  IeltsSkillExercisesPage,
  IeltsSkillHistoryPage,
  IeltsSkillPromptsLibraryPage,
} from '@/pages/ielts-skill-nested-pages'
import HelpDocsBackofficePage from '@/pages/help-docs-backoffice-page'
import NotFoundPage from '@/pages/not-found-page'
import SignInPage from '@/pages/sign-in-page'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTE_SEGMENTS.signIn} element={<SignInPage />} />
          <Route
            path={ROUTE_SEGMENTS.legacyBackoffice}
            element={<Navigate to={ROUTES.writingBackoffice} replace />}
          />
          <Route
            path={ROUTE_SEGMENTS.helpDocsBackoffice}
            element={<HelpDocsBackofficePage />}
          />
          <Route path=":skill" element={<IeltsSkillLayout />}>
            <Route index element={<IeltsSkillHubPage />} />
            <Route path="exercises" element={<IeltsSkillExercisesPage />} />
            <Route path="history" element={<IeltsSkillHistoryPage />} />
            <Route path="backoffice" element={<IeltsSkillBackofficePage />} />
            <Route path="prompts-library" element={<IeltsSkillPromptsLibraryPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
