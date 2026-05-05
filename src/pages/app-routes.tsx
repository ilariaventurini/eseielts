import { BrowserRouter, Route, Routes } from 'react-router'

import { MainLayout } from '@/components/main-layout'
import { ROUTE_SEGMENTS } from '@/constants/routes.constants'
import BackofficePage from '@/pages/backoffice-page'
import HomePage from '@/pages/home-page'
import NotFoundPage from '@/pages/not-found-page'
import SignInPage from '@/pages/sign-in-page'
import WritingHistoryPage from '@/pages/writing-history-page'
import WritingPage from '@/pages/writing-page'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path={ROUTE_SEGMENTS.signIn} element={<SignInPage />} />
          <Route
            path={ROUTE_SEGMENTS.backoffice}
            element={<BackofficePage />}
          />
          <Route path={ROUTE_SEGMENTS.writing} element={<WritingPage />} />
          <Route
            path={ROUTE_SEGMENTS.writingHistory}
            element={<WritingHistoryPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
