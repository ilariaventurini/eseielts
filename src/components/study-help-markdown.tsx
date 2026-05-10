import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const studyHelpMarkdownComponents: Partial<Components> = {
  h2: ({ children }) => (
    <h2 className="mt-6 scroll-mt-4 border-b border-border pb-1 text-base font-semibold text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 text-sm font-semibold text-foreground">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 text-sm font-medium text-foreground">{children}</h4>
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
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-2 hover:text-primary/90"
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  ),
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
  return (
    <div className={cn('study-help-markdown', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={studyHelpMarkdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
