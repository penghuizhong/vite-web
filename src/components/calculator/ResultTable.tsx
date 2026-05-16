import type { CalculatorItem } from '@/types/calculator'

interface ResultTableProps {
  items: CalculatorItem[]
}

export function ResultTable({ items }: ResultTableProps) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--bg-tertiary)' }}>
            <th
              className="px-4 py-3 text-left font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              部位
            </th>
            <th
              className="px-4 py-3 text-right font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              净尺寸
            </th>
            <th
              className="px-4 py-3 text-right font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              余量
            </th>
            <th
              className="px-4 py-3 text-right font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              成品尺寸
            </th>
            <th
              className="px-4 py-3 text-center font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              单位
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={index}
              style={{
                background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              }}
            >
              <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                {item.part}
              </td>
              <td className="px-4 py-3 text-right" style={{ color: 'var(--text-primary)' }}>
                {item.net_size}
              </td>
              <td className="px-4 py-3 text-right" style={{ color: 'var(--accent-primary)' }}>
                +{item.ease}
              </td>
              <td
                className="px-4 py-3 text-right font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.finished}
              </td>
              <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                {item.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
