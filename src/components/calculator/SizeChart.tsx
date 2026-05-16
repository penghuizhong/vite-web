import type { CalculatorItem } from '@/types/calculator'

interface SizeChartProps {
  items: CalculatorItem[]
}

export function SizeChart({ items }: SizeChartProps) {
  const maxValue = Math.max(...items.map((item) => item.finished))

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percentage = (item.finished / maxValue) * 100
        return (
          <div key={item.part} className="flex items-center gap-3">
            <span
              className="w-16 text-sm text-right truncate flex-shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.part}
            </span>
            <div
              className="flex-1 h-6 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  background: 'var(--accent-primary)',
                  opacity: 0.7,
                }}
              />
            </div>
            <span
              className="w-12 text-sm font-medium flex-shrink-0"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.finished}
              {item.unit}
            </span>
          </div>
        )
      })}
    </div>
  )
}
