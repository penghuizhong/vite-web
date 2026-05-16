import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Plus, Mic, Square } from 'lucide-react'

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
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const plusBtnRef = useRef<HTMLButtonElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        plusBtnRef.current &&
        !plusBtnRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasContent = value.trim().length > 0

  return (
    <div className="relative w-full">
      {/* Floating menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-3 w-[calc(100vw-2rem)] sm:w-[260px] rounded-[1.5rem] p-2 shadow-2xl z-50"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex flex-col">
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left group"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-lg">📎</span>
              <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
                添加照片和文件
              </span>
            </button>

            <div className="h-[1px] mx-3 my-1" style={{ background: 'var(--border-default)' }} />

            <button
              type="button"
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left group"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-lg">🎨</span>
              <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
                创建图片
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-full rounded-[2rem] pl-2 pr-2.5 py-2 transition-all"
        style={{
          background: 'var(--bg-primary)',
          border: hasContent
            ? '1px solid var(--accent-primary)'
            : '1px solid var(--border-default)',
        }}
      >
        <button
          type="button"
          ref={plusBtnRef}
          onClick={() => setShowMenu(!showMenu)}
          className="p-3 transition-colors rounded-full"
          style={{
            color: showMenu ? 'var(--text-primary)' : 'var(--text-muted)',
            background: showMenu ? 'var(--accent-light)' : 'transparent',
          }}
        >
          <Plus
            className="h-6 w-6 stroke-[1.5] transition-transform duration-300"
            style={{ transform: showMenu ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>

        <input
          className="flex-1 bg-transparent border-none shadow-none focus:outline-none text-[16px] px-2 disabled:opacity-50"
          style={{
            color: 'var(--text-primary)',
          }}
          placeholder="有问题，尽管问"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
        />

        <button
          type="button"
          className="p-3 transition-colors rounded-full disabled:opacity-50"
          style={{ color: 'var(--text-muted)' }}
          disabled={isStreaming}
        >
          <Mic className="h-[22px] w-[22px] stroke-[1.5]" />
        </button>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="ml-1 h-11 w-11 min-w-[44px] rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
            style={{
              background: '#ef4444',
              color: '#ffffff',
            }}
          >
            <Square className="h-5 w-5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!hasContent || disabled}
            className="ml-1 h-11 w-11 min-w-[44px] rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: hasContent ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: hasContent ? '#ffffff' : 'var(--text-muted)',
              opacity: hasContent ? 1 : 0.8,
              cursor: hasContent ? 'pointer' : 'not-allowed',
            }}
          >
            <ArrowUp className="h-6 w-6 stroke-[2.5]" />
          </button>
        )}
      </form>
    </div>
  )
}
