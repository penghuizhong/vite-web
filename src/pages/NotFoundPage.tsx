import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--accent-primary)' }}>
          404
        </h1>
        <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
          页面未找到
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            background: 'var(--accent-primary)',
            color: '#ffffff',
          }}
        >
          <Home size={16} />
          返回首页
        </Link>
      </div>
    </div>
  )
}
