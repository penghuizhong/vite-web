# 认证集成 + 流式输出打通 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 vite/ 前端集成 core/ 身份认证系统，并打通与 agent/ 的流式 SSE 输出

**Architecture:** 前端使用相对路径请求 API，通过 Nginx 网关路由到对应服务。Token 存储在 localStorage，通过 Bearer header 传递。开发环境通过 Vite proxy 转发。

**Tech Stack:** React, TypeScript, Axios, Zustand, Vite, FastAPI SSE

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `vite/src/lib/auth.ts` | 新增 | Token 管理（localStorage 读写） |
| `vite/src/api/types.ts` | 修改 | 新增认证相关类型定义 |
| `vite/src/api/auth.ts` | 新增 | 认证 API 封装 |
| `vite/src/api/client.ts` | 修改 | 添加 Bearer token 拦截器 |
| `vite/src/api/stream.ts` | 修改 | 相对路径 + token header |
| `vite/src/hooks/useStreamSSE.ts` | 修改 | 自动附加 token |
| `vite/src/hooks/useChat.ts` | 修改 | 对齐 agent API 格式 |
| `vite/vite.config.ts` | 修改 | 添加 dev proxy |
| `vite/.env.example` | 修改 | 移除 VITE_API_BASE_URL |

---

### Task 1: Token 管理工具

**Files:**
- Create: `vite/src/lib/auth.ts`

- [ ] **Step 1: 创建 Token 管理模块**

```ts
// vite/src/lib/auth.ts
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function removeTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/fyzj/vite && git add src/lib/auth.ts
git commit -m "feat: add token management utilities"
```

---

### Task 2: 认证类型定义

**Files:**
- Modify: `vite/src/api/types.ts`

- [ ] **Step 1: 扩展类型定义**

读取当前 `vite/src/api/types.ts`，在文件末尾追加：

```ts
export interface TokenResponse {
  access_token: string
  refresh_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname: string
}

export interface UserResponse {
  id: string
  email: string
  nickname: string
  is_active: boolean
}

export interface StreamRequest {
  message: string
  thread_id: string | null
  stream_tokens?: boolean
  agent_id?: string
  model?: string
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/fyzj/vite && git add src/api/types.ts
git commit -m "feat: add auth and streaming type definitions"
```

---

### Task 3: 认证 API 封装

**Files:**
- Create: `vite/src/api/auth.ts`

- [ ] **Step 1: 创建认证 API 模块**

```ts
// vite/src/api/auth.ts
import { client } from '@/api/client'
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '@/api/types'

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const { data: response } = await client.post<TokenResponse>('/api/v1/auth/login', data)
  return response
}

export async function register(data: RegisterRequest): Promise<TokenResponse> {
  const { data: response } = await client.post<TokenResponse>('/api/v1/auth/register', data)
  return response
}

export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  const { data: response } = await client.post<TokenResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  })
  return response
}

export async function getMe(): Promise<UserResponse> {
  const { data: response } = await client.get<UserResponse>('/api/v1/auth/me')
  return response
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/fyzj/vite && git add src/api/auth.ts
git commit -m "feat: add auth API module"
```

---

### Task 4: Axios 拦截器

**Files:**
- Modify: `vite/src/api/client.ts`

- [ ] **Step 1: 修改 Axios 客户端**

读取当前 `vite/src/api/client.ts`，替换为：

```ts
import axios from 'axios'
import { getToken, removeTokens } from '@/lib/auth'

export const client = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    const message = error.response?.data?.detail ?? error.message ?? '未知错误'
    return Promise.reject(new Error(message))
  }
)
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/fyzj/vite && git add src/api/client.ts
git commit -m "feat: add Bearer token interceptor and 401 handler"
```

---

### Task 5: 流式请求改造

**Files:**
- Modify: `vite/src/api/stream.ts`

- [ ] **Step 1: 修改 stream.ts**

读取当前 `vite/src/api/stream.ts`，替换为：

```ts
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/fyzj/vite && git add src/api/stream.ts
git commit -m "feat: update streamSSE to use relative path and Bearer token"
```

---

### Task 6: useStreamSSE Hook 改造

**Files:**
- Modify: `vite/src/hooks/useStreamSSE.ts`

- [ ] **Step 1: 修改 useStreamSSE**

读取当前 `vite/src/hooks/useStreamSSE.ts`，替换 `startStream` 中的 fetch 调用部分。关键改动：

1. 导入 `getToken`
2. 在 fetch headers 中自动附加 token
3. URL 支持相对路径

完整替换文件内容：

```ts
import { useCallback, useRef, useState } from 'react'
import { getToken } from '@/lib/auth'

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

export function useStreamSSE() {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    text: '',
    error: null,
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(async (options: StreamOptions) => {
    const { url, method = 'POST', body, headers = {}, onChunk, onDone, onError } = options
    const token = getToken()

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setState({ isStreaming: true, text: '', error: null })
    let accumulated = ''

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
              const chunk = parsed.type === 'token'
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/mac/fyzj/vite && git add src/hooks/useStreamSSE.ts
git commit -m "feat: update useStreamSSE to auto-attach Bearer token"
```

---

### Task 7: useChat Hook 改造

**Files:**
- Modify: `vite/src/hooks/useChat.ts`
- Modify: `vite/src/types/chat.ts`

- [ ] **Step 1: 更新 ChatRequest 类型**

读取 `vite/src/types/chat.ts`，将 `ChatRequest` 接口修改为：

```ts
export interface ChatRequest {
  message: string
  thread_id: string | null
  stream_tokens?: boolean
}
```

- [ ] **Step 2: 修改 useChat**

读取 `vite/src/hooks/useChat.ts`，替换 `sendMessage` 中的请求部分：

```ts
const request: ChatRequest = {
  message: content,
  thread_id: convId,
  stream_tokens: true,
}

await startStream({
  url: '/v1/agent/stream',
  method: 'POST',
  body: request,
  onChunk: (chunk) => {
    const active = getActiveConversation()
    if (active) {
      const msg = active.messages.find((m) => m.id === assistantMessageId)
      if (msg) {
        updateMessage(convId, assistantMessageId, msg.content + chunk)
      }
    }
  },
  onDone: () => {
    setMessageStreaming(convId, assistantMessageId, false)
  },
  onError: () => {
    setMessageStreaming(convId, assistantMessageId, false)
  },
})
```

同时移除 `API_BASE_URL` 的导入。

- [ ] **Step 3: Commit**

```bash
cd /Users/mac/fyzj/vite && git add src/types/chat.ts src/hooks/useChat.ts
git commit -m "feat: update useChat to use agent API format with relative path"
```

---

### Task 8: Vite Dev Proxy 配置

**Files:**
- Modify: `vite/vite.config.ts`
- Modify: `vite/.env.example`

- [ ] **Step 1: 修改 Vite 配置**

读取 `vite/vite.config.ts`，替换为：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 2: 更新 .env.example**

读取 `vite/.env.example`，替换为：

```
VITE_APP_NAME=制版 AI 助手
```

（移除 `VITE_API_BASE_URL`，因为现在使用相对路径）

- [ ] **Step 3: 更新 constants.ts**

读取 `vite/src/lib/constants.ts`，移除 `API_BASE_URL` 导出：

```ts
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? '制版 AI 助手'

export const EXAMPLE_PROMPTS = [
  '如何根据胸围确定袖窿深？',
  '合体型西装的肩宽余量一般是多少？',
  '请解释原型制版中胸省的处理方法',
  '不同面料的缩水率如何影响制版尺寸？',
]
```

- [ ] **Step 4: 清理引用**

搜索并移除 `API_BASE_URL` 在所有文件中的引用（stream.ts 已移除）。

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/fyzj/vite && git add vite.config.ts .env.example src/lib/constants.ts
git commit -m "feat: configure Vite dev proxy and remove API_BASE_URL"
```

---

### Task 9: 验证与测试

**Files:**
- 手动验证

- [ ] **Step 1: 启动后端服务**

```bash
cd /Users/mac/fyzj
docker compose up core agent -d
```

确认 core 运行在 `localhost:8000`，agent 运行在 `localhost:8001`。

- [ ] **Step 2: 启动前端**

```bash
cd /Users/mac/fyzj/vite
npm run dev
```

- [ ] **Step 3: 验证认证流程**

1. 打开 `http://localhost:5173`
2. 调用 `/api/v1/auth/register` 注册测试用户
3. 调用 `/api/v1/auth/login` 登录，确认 token 存入 localStorage
4. 打开浏览器 DevTools → Application → LocalStorage，确认 `access_token` 和 `refresh_token` 存在

- [ ] **Step 4: 验证流式输出**

1. 发送一条聊天消息
2. 在 Network 面板查看 `/v1/agent/stream` 请求
3. 确认请求头包含 `Authorization: Bearer <token>`
4. 确认响应为 `text/event-stream` 格式
5. 确认 UI 逐块渲染 SSE 内容

- [ ] **Step 5: 验证 401 处理**

1. 手动清除 localStorage 中的 token
2. 发送聊天消息
3. 确认收到 401 响应
4. 确认触发 `auth:logout` 事件（后续可绑定到登录页跳转）

- [ ] **Step 6: 运行 TypeScript 检查**

```bash
cd /Users/mac/fyzj/vite
npx tsc --noEmit
```

确认无类型错误。

- [ ] **Step 7: 运行 Lint**

```bash
cd /Users/mac/fyzj/vite
npm run lint
```

- [ ] **Step 8: 最终 Commit**

```bash
cd /Users/mac/fyzj/vite && git add -A
git commit -m "chore: verify auth + streaming integration"
```
