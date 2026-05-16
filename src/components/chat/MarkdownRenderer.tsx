import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import 'highlight.js/styles/github.css'

interface CodeBlockProps {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}

function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className ?? '')
  const language = match?.[1] ?? ''
  const code = String(children).replace(/\n$/, '')

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-4">
      {language && (
        <div
          className="absolute top-0 left-0 px-3 py-1 text-xs font-mono rounded-tl-[10px] rounded-br-[6px]"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          {language}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        aria-label="复制代码"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>
      <pre className={className}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

interface MarkdownRendererProps {
  content: string
  isStreaming?: boolean
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${isStreaming ? 'streaming-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={{
          code: CodeBlock as React.ComponentType<React.HTMLAttributes<HTMLElement>>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
