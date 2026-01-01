import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
}

export function MarkdownRenderer({ content, className, isUserMessage = false }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", className)}>
      <ReactMarkdown
        components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className={cn("font-bold", isUserMessage ? "text-primary-foreground" : "text-foreground")}>
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className={cn("italic", isUserMessage ? "text-primary-foreground" : "text-foreground")}>
            {children}
          </em>
        ),
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        code: ({ children }) => (
          <code className={cn(
            "px-1 py-0.5 rounded text-xs font-mono",
            isUserMessage ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
          )}>
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className={cn(
            "p-2 rounded-md my-2 overflow-x-auto text-xs",
            isUserMessage ? "bg-primary-foreground/10" : "bg-muted"
          )}>
            {children}
          </pre>
        ),
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(
              "underline hover:opacity-80",
              isUserMessage ? "text-primary-foreground" : "text-primary"
            )}
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className={cn(
            "border-l-2 pl-3 my-2 italic",
            isUserMessage ? "border-primary-foreground/50" : "border-primary/50"
          )}>
            {children}
          </blockquote>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
