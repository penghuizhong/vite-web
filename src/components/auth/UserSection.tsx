import { User, LogOut, LogIn, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

export function UserSection() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { setAuthModalOpen } = useUiStore()

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            <LogIn size={14} />
            登录
          </button>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <UserPlus size={14} />
            注册
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-light)' }}
        >
          <User size={18} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {user.nickname}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {user.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          aria-label="登出"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
