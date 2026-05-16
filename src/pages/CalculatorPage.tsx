import { useState } from 'react'
import { CalculatorForm } from '@/components/calculator/CalculatorForm'
import { ResultCard } from '@/components/calculator/ResultCard'
import { ResultTable } from '@/components/calculator/ResultTable'
import { SizeChart } from '@/components/calculator/SizeChart'
import { useCalculator } from '@/hooks/useCalculator'
import type { StyleEase } from '@/types/calculator'

export function CalculatorPage() {
  const { calculate, isLoading, data, error } = useCalculator()
  const [hasCalculated, setHasCalculated] = useState(false)

  const handleSubmit = (formData: {
    height: number
    chest: number
    waist: number
    hip: number
    shoulder: number
    style_ease: StyleEase
  }) => {
    setHasCalculated(true)
    calculate(formData)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            制版计算工具
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            输入人体尺寸参数，自动计算各部位制版尺寸
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div
              className="rounded-xl border p-5 sticky top-20"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
              }}
            >
              <CalculatorForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {error && (
              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  background: 'var(--accent-light)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                }}
              >
                计算失败：{error.message}
              </div>
            )}

            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border p-4 animate-pulse"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-default)',
                    }}
                  >
                    <div
                      className="h-4 w-20 rounded mb-3"
                      style={{ background: 'var(--bg-tertiary)' }}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="h-10 rounded"
                          style={{ background: 'var(--bg-tertiary)' }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data && !isLoading && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                      计算结果
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          background: 'var(--accent-light)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {data.total_ease}
                      </span>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        尺码: {data.size_code}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {data.items.map((item) => (
                      <ResultCard
                        key={item.part}
                        part={item.part}
                        netSize={item.net_size}
                        ease={item.ease}
                        finished={item.finished}
                        unit={item.unit}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3
                    className="text-base font-medium mb-3"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    尺寸对比图
                  </h3>
                  <SizeChart items={data.items} />
                </div>

                <div>
                  <h3
                    className="text-base font-medium mb-3"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    详细数据表
                  </h3>
                  <ResultTable items={data.items} />
                </div>
              </>
            )}

            {!hasCalculated && !isLoading && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">在左侧输入参数后点击「开始计算」</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
