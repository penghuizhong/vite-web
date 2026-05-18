import { useCallback, useRef, useState } from 'react'
import { getToken, getRefreshToken, setTokens } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/env'

export type SSETokenEvent = { type: 'token'; content: string }
export type SSEMessageEvent = { type: 'message'; content: Record<string, unknown> }
export type SSEErrorEvent = { type: 'error'; content: string }
export type SSEEvent = SSETokenEvent | SSEMessageEvent | SSEErrorEvent

interface StreamOptions {
  url: string
  method?: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
  onToken?: (token: string) => void // 流式 token 片段
  onMessage?: (message: Record<string, unknown>) => void // 完整消息对象
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

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) throw new Error('Token refresh failed')

  const data = (await response.json()) as { access_token: string; refresh_token: string }
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

/** 解析单条 SSE data 行，返回结构化事件；解析失败返回 null */
function parseSSEEvent(data: string): SSEEvent | null {
  try {
    const parsed = JSON.parse(data) as { type?: string; content?: unknown }
    const { type, content } = parsed

    if (type === 'token' && typeof content === 'string') {
      return { type: 'token', content }
    }
    if (type === 'message' && content !== null && typeof content === 'object') {
      return { type: 'message', content: content as Record<string, unknown> }
    }
    if (type === 'error' && typeof content === 'string') {
      return { type: 'error', content }
    }

    console.warn('[useStreamSSE] 未识别的 SSE 事件，已跳过:', parsed)
    return null
  } catch {
    // 非 JSON 裸文本，当 token 处理
    return { type: 'token', content: data }
  }
}

export function useStreamSSE() {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    text: '',
    error: null,
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (options: StreamOptions) => {
    const {
      url,
      method = 'POST',
      body,
      headers = {},
      onToken,
      onMessage,
      onDone,
      onError,
    } = options

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setState({ isStreaming: true, text: '', error: null })
    let accumulated = ''

    async function processStream(response: Response) {
      if (!response.body) throw new Error('Response body is null')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const rawChunk = decoder.decode(value, { stream: true })
        const lines = rawChunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          const event = parseSSEEvent(data)
          if (!event) continue

          if (event.type === 'token') {
            // 流式 token：累积并实时更新 UI
            accumulated += event.content
            onToken?.(event.content)
            setState((prev) => ({ ...prev, text: accumulated }))
          } else if (event.type === 'message') {
            // 完整消息：交给调用方处理（替换最终内容）
            onMessage?.(event.content)
          } else if (event.type === 'error') {
            throw new Error(event.content)
          }
        }
      }
    }

    let token = getToken()

    const makeHeaders = (t: string | null): Record<string, string> => ({
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...headers,
    })

    try {
      let response = await fetch(url, {
        method,
        headers: makeHeaders(token),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (response.status === 401) {
        token = await refreshAccessToken()
        response = await fetch(url, {
          method,
          headers: makeHeaders(token),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
      }

      await processStream(response)

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
