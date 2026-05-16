import { useCallback, useRef, useState } from 'react'
import { getToken, getRefreshToken, setTokens } from '@/lib/auth'

interface StreamOptions {
  url: string
  method?: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
  onChunk?: (chunk: string) => void
  onDone?: (fullText: string) => void
  onError?: (error: Error) => void
}

interface StreamState {
  isStreaming: boolean
  text: string
  error: Error | null
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) throw new Error('Token refresh failed')

  const data = (await response.json()) as { access_token: string; refresh_token: string }
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

export function useStreamSSE() {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    text: '',
    error: null,
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (options: StreamOptions) => {
    const { url, method = 'POST', body, headers = {}, onChunk, onDone, onError } = options

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setState({ isStreaming: true, text: '', error: null })
    let accumulated = ''

    let token = getToken()

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (response.status === 401) {
        token = await refreshAccessToken()
        const retryResponse = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        if (!retryResponse.ok) {
          throw new Error(`HTTP error: ${retryResponse.status} ${retryResponse.statusText}`)
        }

        if (!retryResponse.body) {
          throw new Error('Response body is null')
        }

        const reader = retryResponse.body.getReader()
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
                const parsed = JSON.parse(data) as {
                  type?: string
                  content?: string
                  text?: string
                }
                const chunk =
                  parsed.type === 'token'
                    ? (parsed.content ?? '')
                    : (parsed.content ?? parsed.text ?? data)
                accumulated += chunk
                onChunk?.(chunk)
              } catch {
                accumulated += data
                onChunk?.(data)
              }

              setState((prev) => ({ ...prev, text: accumulated }))
            }
          }
        }

        setState((prev) => ({ ...prev, isStreaming: false }))
        onDone?.(accumulated)
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
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
              const chunk =
                parsed.type === 'token'
                  ? (parsed.content ?? '')
                  : (parsed.content ?? parsed.text ?? data)
              accumulated += chunk
              onChunk?.(chunk)
            } catch {
              accumulated += data
              onChunk?.(data)
            }

            setState((prev) => ({ ...prev, text: accumulated }))
          }
        }
      }

      setState((prev) => ({ ...prev, isStreaming: false }))
      onDone?.(accumulated)
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setState((prev) => ({ ...prev, isStreaming: false }))
        return
      }
      const err = error instanceof Error ? error : new Error(String(error))
      setState({ isStreaming: false, text: accumulated, error: err })
      onError?.(err)
    }
  }, [])

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  return { ...state, startStream, stopStream }
}
