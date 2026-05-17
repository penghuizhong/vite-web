import { useState } from 'react'
import { X, Lock, User } from 'lucide-react' // 💡 移除了 Mail，保留 User 作为通用图标
import { useAuthStore } from '@/stores/authStore'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const { login, register, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('请填写所有必填字段')
      return
    }

    if (username.length < 3) {
      setError('用户名至少需要3个字符')
      return
    }

    // 💡 修正点 1：将长度拦截阈值由 8 改为 6，与后端的最低限制以及 placeholder 保持完全一致
    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    if (mode === 'register' && !nickname) {
      setError('请填写昵称')
      return
    }

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password, nickname)
      }
      onClose()
      resetForm()
    } catch {
      // 💡 修正点 2：将兜底报错提示中的“邮箱”彻底修正为“用户名”
      setError(mode === 'login' ? '登录失败，请检查用户名和密码' : '注册失败，请稍后重试')
    }
  }

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setNickname('')
    setError('')
    setMode('login')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? '登录' : '注册'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                昵称
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="请输入昵称"
                />
              </div>
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              用户名
            </label>
            <div className="relative">
              {/* 💡 修正点 3：将原先的信封图标 Mail 替换为 User 图标，更契合“用户名”语义 */}
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="请输入用户名"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              密码
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                placeholder="请输入密码（至少6位）"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="text-sm transition-colors"
            style={{ color: 'var(--accent-primary)' }}
          >
            {mode === 'login' ? '还没有账号？立即注册' : '已有账号？立即登录'}
          </button>
        </div>
      </div>
    </div>
  )
}
