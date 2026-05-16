import { EXAMPLE_PROMPTS } from '@/lib/constants'

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void
}

export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-2">
          <svg
            className="mx-auto h-12 w-12"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="48" height="48" rx="12" fill="var(--accent-primary)" fillOpacity="0.1" />
            <path
              d="M14 16C14 14.8954 14.8954 14 16 14H32C33.1046 14 34 14.8954 34 16V32C34 33.1046 33.1046 34 32 34H16C14.8954 34 14 33.1046 14 32V16Z"
              stroke="var(--accent-primary)"
              strokeWidth="2"
            />
            <path
              d="M20 20L28 28M28 20L20 28"
              stroke="var(--accent-primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          服装制版 AI 助手
        </h1>
        <p className="text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
          输入您的制版问题，AI 将为您提供专业的尺寸分析、工艺建议和制版方案
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onPromptClick(prompt)}
              className="text-left p-4 rounded-xl border transition-all hover:shadow-sm"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <p className="text-sm">{prompt}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
