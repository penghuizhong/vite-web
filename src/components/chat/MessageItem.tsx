import { MarkdownRenderer } from './MarkdownRenderer'
import { formatTime } from '@/lib/utils'
import type { Message } from '@/types/chat'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div
        className={`max-w-2xl rounded-2xl px-5 py-4 ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}
        style={{
          background: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
          color: isUser ? '#ffffff' : 'var(--text-primary)',
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-7">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} />
        )}
        <div
          className={`text-xs mt-2 ${isUser ? 'text-white/60' : ''}`}
          style={{ color: isUser ? undefined : 'var(--text-muted)' }}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
