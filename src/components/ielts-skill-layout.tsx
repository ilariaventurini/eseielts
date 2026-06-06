import { Link, Outlet, useLocation, useParams } from 'react-router'

import { isIeltsSkill, skillRootPath, type IeltsSkill } from '@/constants/routes.constants'
import NotFoundPage from '@/pages/not-found-page'

function skillOverviewLabel(s: IeltsSkill) {
  if (s === 'listening') {
    return 'Listening'
  }
  if (s === 'reading') {
    return 'Reading'
  }
  if (s === 'writing') {
    return 'Writing'
  }
  return 'Speaking'
}

export function IeltsSkillLayout() {
  const { skill } = useParams()
  const { pathname } = useLocation()

  if (!isIeltsSkill(skill)) {
    return <NotFoundPage />
  }

  const hubPath = skillRootPath(skill)
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname
  const isHub = normalizedPath === hubPath

  return (
    <div className="flex flex-col gap-4">
      {!isHub ? (
        <div>
          <Link
            to={hubPath}
            className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            ← {skillOverviewLabel(skill)} overview
          </Link>
        </div>
      ) : null}
      <Outlet />
    </div>
  )
}
