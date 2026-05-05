import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes.constants'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col gap-4 text-left">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This path does not exist or has been moved.
      </p>
      <Button asChild className="w-fit cursor-pointer">
        <Link to={ROUTES.home}>Back to home</Link>
      </Button>
    </div>
  )
}
