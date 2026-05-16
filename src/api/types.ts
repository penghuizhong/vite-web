export interface ChatRequest {
  message: string
  conversation_id: string | null
  context?: Record<string, unknown>
}

export interface ChatSSEChunk {
  content?: string
  text?: string
}

export interface CalculatorRequest {
  height: number
  chest: number
  waist: number
  hip: number
  shoulder: number
  style_ease: 'slim' | 'normal' | 'loose'
}

export interface CalculatorItem {
  part: string
  net_size: number
  ease: number
  finished: number
  unit: string
}

export interface CalculatorResponse {
  items: CalculatorItem[]
  total_ease: string
  size_code: string
}
