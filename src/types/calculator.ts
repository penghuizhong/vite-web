export type StyleEase = 'slim' | 'normal' | 'loose'

export interface CalculatorRequest {
  height: number
  chest: number
  waist: number
  hip: number
  shoulder: number
  style_ease: StyleEase
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
