import { streamSSE } from '@/api/stream'
import type { ChatRequest } from '@/api/types'

export function chatStream(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  signal: AbortSignal
) {
  streamSSE({
    body: request,
    onChunk,
    onDone,
    onError,
    signal,
  })
}
