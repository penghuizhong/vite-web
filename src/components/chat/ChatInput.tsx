import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  disabled?: boolean
  isStreaming?: boolean
}

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasContent = value.trim().length > 0

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div
        className="relative flex items-end gap-2 rounded-2xl border px-4 py-3 transition-colors"
        style={{
          background: 'var(--bg-primary)',
          borderColor: hasContent ? 'var(--accent-primary)' : 'var(--border-default)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入制版问题..."
          rows={1}
          disabled={disabled || isStreaming}
          className="flex-1 resize-none bg-transparent outline-none text-base leading-7 placeholder:text-muted-foreground"
          style={{ color: 'var(--text-primary)', maxHeight: '200px' }}
        />
        <div className="flex items-center gap-1 pb-1">
          {isStreaming ? (
            <button
              onClick={onStop}
              className="p-2 rounded-full transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              aria-label="停止生成"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!hasContent || disabled}
              className="p-2 rounded-full transition-all"
              style={{
                background: hasContent ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: hasContent ? '#ffffff' : 'var(--text-muted)',
                opacity: hasContent ? 1 : 0.5,
              }}
              aria-label="发送消息"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
        AI 生成的内容仅供参考，请以实际制版经验为准
      </p>
    </div>
  )
}
