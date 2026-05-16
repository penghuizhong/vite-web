import { ChevronDown, Trash2 } from 'lucide-react'

interface PanelHeaderProps {
  hasMessages: boolean
  onClear: () => void
  onClose: () => void
}

export function PanelHeader({ hasMessages, onClear, onClose }: PanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 shrink-0"
      style={{
        borderBottom: '1px solid color-mix(in oklch, var(--border-default) 30%, transparent)',
        background: 'color-mix(in oklch, var(--bg-secondary) 20%, transparent)',
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: '#10b981',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          }}
        />
        服装制版 AI
      </div>
      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            type="button"
            onClick={onClear}
            className="p-2 rounded-full transition-colors"
            style={{
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'color-mix(in oklch, var(--bg-tertiary) 50%, transparent)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
            title="清空记录"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              'color-mix(in oklch, var(--bg-tertiary) 50%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title="收起面板"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  )
}
