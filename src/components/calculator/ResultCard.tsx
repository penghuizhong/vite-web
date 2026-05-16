interface ResultCardProps {
  part: string
  netSize: number
  ease: number
  finished: number
  unit: string
}

export function ResultCard({ part, netSize, ease, finished, unit }: ResultCardProps) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {part}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--accent-light)',
            color: 'var(--accent-primary)',
          }}
        >
          {unit}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            净尺寸
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {netSize}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            余量
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
            +{ease}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            成品尺寸
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {finished}
          </p>
        </div>
      </div>
    </div>
  )
}
