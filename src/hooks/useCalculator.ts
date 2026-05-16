import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import type { CalculatorRequest, CalculatorResponse } from '@/types/calculator'

async function calculatePattern(data: CalculatorRequest): Promise<CalculatorResponse> {
  const response = await axios.post<CalculatorResponse>(
    `${API_BASE_URL}/api/v1/calculator/pattern`,
    data
  )
  return response.data
}

export function useCalculator() {
  const mutation = useMutation({
    mutationFn: calculatePattern,
  })

  return {
    calculate: mutation.mutate,
    calculateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}
