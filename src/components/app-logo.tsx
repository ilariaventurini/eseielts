import { cn } from '@/lib/utils'

interface AppLogoProps {
  readonly className?: string
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <span className={cn('inline-block shrink-0 size-4', className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="size-full"
        aria-hidden
      >
        <rect className="fill-background" width="32" height="32" />
        <rect className="fill-background" x="0" y="0" width="16" height="16" />
        <rect className="fill-background" x="16" y="0" width="16" height="16" />
        <rect className="fill-background" x="0" y="16" width="16" height="16" />
        <rect
          className="fill-accent-highlight"
          x="16"
          y="16"
          width="16"
          height="16"
        />
        <rect
          className="fill-none stroke-foreground"
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          strokeWidth="1"
        />
        <line
          className="stroke-foreground"
          x1="16"
          y1="0"
          x2="16"
          y2="32"
          strokeWidth="1"
        />
        <line
          className="stroke-foreground"
          x1="0"
          y1="16"
          x2="32"
          y2="16"
          strokeWidth="1"
        />
      </svg>
    </span>
  )
}
