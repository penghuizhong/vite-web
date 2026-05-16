import { Sun, Moon, Menu, Calculator, MessageSquare } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useUiStore } from '@/stores/uiStore'
import { Link, useLocation } from 'react-router-dom'
import { APP_NAME } from '@/lib/constants'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const { toggleSidebar } = useUiStore()
  const location = useLocation()

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-sm"
      style={{
        background: 'var(--bg-primary)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg lg:hidden"
            style={{ color: 'var(--text-primary)' }}
            aria-label="切换侧边栏"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-primary)' }}
            >
              <MessageSquare size={16} className="text-white" />
            </div>
            <span
              className="font-semibold text-base hidden sm:inline"
              style={{ color: 'var(--text-primary)' }}
            >
              {APP_NAME}
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              color: location.pathname === '/' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: location.pathname === '/' ? 'var(--accent-light)' : 'transparent',
            }}
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare size={14} />
              AI 助手
            </span>
          </Link>
          <Link
            to="/calculator"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              color:
                location.pathname === '/calculator'
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
              background:
                location.pathname === '/calculator' ? 'var(--accent-light)' : 'transparent',
            }}
          >
            <span className="flex items-center gap-1.5">
              <Calculator size={14} />
              计算工具
            </span>
          </Link>
        </nav>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="切换主题"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
