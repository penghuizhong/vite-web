import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { StyleEase } from '@/types/calculator'

const calculatorSchema = z.object({
  height: z.number().min(140).max(200),
  chest: z.number().min(60).max(140),
  waist: z.number().min(50).max(130),
  hip: z.number().min(60).max(140),
  shoulder: z.number().min(30).max(60),
  style_ease: z.enum(['slim', 'normal', 'loose']),
})

type CalculatorFormData = z.infer<typeof calculatorSchema>

interface CalculatorFormProps {
  onSubmit: (data: CalculatorFormData) => void
  isLoading: boolean
}

const styleEaseOptions: { value: StyleEase; label: string }[] = [
  { value: 'slim', label: '修身' },
  { value: 'normal', label: '合体' },
  { value: 'loose', label: '宽松' },
]

export function CalculatorForm({ onSubmit, isLoading }: CalculatorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      height: 165,
      chest: 88,
      waist: 70,
      hip: 94,
      shoulder: 38,
      style_ease: 'normal',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            身高 (cm)
          </label>
          <input
            type="number"
            {...register('height', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-primary)',
              borderColor: errors.height ? '#ef4444' : 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          {errors.height && <p className="text-xs mt-1 text-red-500">{errors.height.message}</p>}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            胸围 (cm)
          </label>
          <input
            type="number"
            {...register('chest', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-primary)',
              borderColor: errors.chest ? '#ef4444' : 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          {errors.chest && <p className="text-xs mt-1 text-red-500">{errors.chest.message}</p>}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            腰围 (cm)
          </label>
          <input
            type="number"
            {...register('waist', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-primary)',
              borderColor: errors.waist ? '#ef4444' : 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          {errors.waist && <p className="text-xs mt-1 text-red-500">{errors.waist.message}</p>}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            臀围 (cm)
          </label>
          <input
            type="number"
            {...register('hip', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-primary)',
              borderColor: errors.hip ? '#ef4444' : 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          {errors.hip && <p className="text-xs mt-1 text-red-500">{errors.hip.message}</p>}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            肩宽 (cm)
          </label>
          <input
            type="number"
            {...register('shoulder', { valueAsNumber: true })}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-primary)',
              borderColor: errors.shoulder ? '#ef4444' : 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          {errors.shoulder && (
            <p className="text-xs mt-1 text-red-500">{errors.shoulder.message}</p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            款式松紧
          </label>
          <div className="flex gap-2">
            {styleEaseOptions.map((option) => (
              <label
                key={option.value}
                className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register('style_ease')}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: isLoading ? 'var(--text-muted)' : 'var(--accent-primary)',
          color: '#ffffff',
        }}
      >
        {isLoading ? '计算中...' : '开始计算'}
      </button>
    </form>
  )
}
