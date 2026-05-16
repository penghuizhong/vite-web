import { getToken } from '@/lib/auth'

interface StreamOptions {
  body: unknown
  onChunk: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
  signal: AbortSignal
}

export async function streamSSE(options: StreamOptions): Promise<void> {
  const { body, onChunk, onDone, onError, signal } = options
  const token = getToken()

  try {
    const response = await fetch('/v1/agent/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const rawChunk = decoder.decode(value, { stream: true })
      const lines = rawChunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data) as { type?: string; content?: string; text?: string }
            if (parsed.type === 'token') {
              onChunk(parsed.content ?? '')
            } else if (parsed.content ?? parsed.text) {
              onChunk(parsed.content ?? parsed.text ?? '')
            } else {
              onChunk(data)
            }
          } catch {
            onChunk(data)
          }
        }
      }
    }

    onDone?.()
  } catch (error) {
    if ((error as Error).name === 'AbortError') return
    onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}
