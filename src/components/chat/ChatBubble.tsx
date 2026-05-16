import { MessageCircle } from 'lucide-react'

interface ChatBubbleProps {
  onClick: () => void
  hidden: boolean
}

export function ChatBubble({ onClick, hidden }: ChatBubbleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chat-bubble-btn p-3.5 rounded-full shadow-2xl group ${
        hidden ? 'hidden-bubble' : ''
      }`}
      style={{
        background: 'color-mix(in oklch, var(--bg-primary) 90%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid color-mix(in oklch, var(--border-default) 50%, transparent)',
        color: 'var(--text-primary)',
      }}
      aria-label="唤醒 AI 助手"
    >
      <MessageCircle size={26} className="transition-colors duration-300" />
    </button>
  )
}
