import {
  createContext,
  useContext,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const SCROLL_OFFSET_PX = 16

interface StudyHelpMarkdownContextValue {
  rootRef: RefObject<HTMLDivElement | null>
}

const StudyHelpMarkdownContext = createContext<StudyHelpMarkdownContextValue | null>(
  null,
)

function useStudyHelpMarkdownContext() {
  const context = useContext(StudyHelpMarkdownContext)
  if (context === null) {
    throw new Error('StudyHelpMarkdown anchor links must render inside StudyHelpMarkdown')
  }
  return context
}

function isHashLink(href: string | undefined): href is string {
  return typeof href === 'string' && href.startsWith('#') && href.length > 1
}

function getScrollableAncestor(element: HTMLElement) {
  let current: HTMLElement | null = element.parentElement
  while (current !== null) {
    const { overflowY } = window.getComputedStyle(current)
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      current.scrollHeight > current.clientHeight
    ) {
      return current
    }
    current = current.parentElement
  }
  return null
}

function scrollToElement(target: HTMLElement) {
  const scrollContainer = getScrollableAncestor(target)
  if (scrollContainer === null) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  const targetTop =
    target.getBoundingClientRect().top -
    scrollContainer.getBoundingClientRect().top +
    scrollContainer.scrollTop
  scrollContainer.scrollTo({
    top: Math.max(0, targetTop - SCROLL_OFFSET_PX),
    behavior: 'smooth',
  })
}

function findHashTarget(href: string, root: HTMLElement | null) {
  const id = decodeURIComponent(href.slice(1))
  if (root !== null) {
    const scopedTarget = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
    if (scopedTarget !== null) {
      return scopedTarget
    }
  }
  return document.getElementById(id)
}

function scrollToHashTarget(href: string, root: HTMLElement | null) {
  const target = findHashTarget(href, root)
  if (target === null) {
    return
  }
  scrollToElement(target)
}

function handleHashLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  root: HTMLElement | null,
) {
  event.preventDefault()
  scrollToHashTarget(href, root)
}

function MarkdownAnchor({
  children,
  href,
}: {
  children?: ReactNode
  href?: string | undefined
}) {
  const { rootRef } = useStudyHelpMarkdownContext()
  const hashLink = isHashLink(href)

  return (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-2 hover:text-primary/90"
      {...(hashLink
        ? {
            onClick: (event) => {
              handleHashLinkClick(event, href, rootRef.current)
            },
          }
        : {
            target: '_blank',
            rel: 'noreferrer noopener',
          })}
    >
      {children}
    </a>
  )
}

const studyHelpMarkdownComponents: Partial<Components> = {
  h1: ({ children, id }) => (
    <h1
      id={id}
      className="mt-8 scroll-mt-4 text-lg font-semibold text-foreground first:mt-0"
    >
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2
      id={id}
      className="mt-6 scroll-mt-4 border-b border-border pb-1 text-base font-semibold text-foreground first:mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3 id={id} className="mt-4 scroll-mt-4 text-sm font-semibold text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children, id }) => (
    <h4 id={id} className="mt-3 scroll-mt-4 text-sm font-medium text-foreground">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-muted-foreground last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed [&>p]:mb-0 [&:has(input[type='checkbox'])]:flex [&:has(input[type='checkbox'])]:items-start [&:has(input[type='checkbox'])]:gap-2">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  a: MarkdownAnchor,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }) => (
    <div className="mb-4 w-full overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[20rem] border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/80">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border-r border-border px-3 py-2 font-semibold text-foreground last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-r border-border px-3 py-2 align-top text-muted-foreground last:border-r-0">
      {children}
    </td>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-md border border-border bg-muted/50 p-3 text-xs leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === 'string' && className.includes('language-')
    if (!isBlock) {
      return (
        <code
          className={cn(
            'rounded bg-muted px-1 py-0.5 font-mono text-[0.8125rem] text-foreground in-[pre]:bg-transparent in-[pre]:p-0 in-[pre]:text-inherit'
          )}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  },
  input: ({ checked, type, ...props }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={Boolean(checked)}
          disabled
          className="mt-0.5 size-3.5 shrink-0 rounded border-border accent-primary"
          aria-checked={checked ? 'true' : 'false'}
          {...props}
        />
      )
    }
    return <input type={type} {...props} />
  },
}

interface StudyHelpMarkdownProps {
  markdown: string
  className?: string
}

export function StudyHelpMarkdown({ markdown, className }: StudyHelpMarkdownProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <StudyHelpMarkdownContext.Provider value={{ rootRef }}>
      <div ref={rootRef} className={cn('study-help-markdown', className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug]}
          components={studyHelpMarkdownComponents}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </StudyHelpMarkdownContext.Provider>
  )
}
