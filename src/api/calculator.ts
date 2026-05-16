import { client } from '@/api/client'
import type { CalculatorRequest, CalculatorResponse } from '@/api/types'

export async function calculatePattern(data: CalculatorRequest): Promise<CalculatorResponse> {
  const response = await client.post<CalculatorResponse>('/api/v1/calculator/pattern', data)
  return response.data
}
