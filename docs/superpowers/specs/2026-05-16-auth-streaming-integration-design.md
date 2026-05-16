# 认证集成 + 流式输出打通 - 设计文档

**日期**: 2026-05-16  
**状态**: 待审核  

## 1. 概述

在 vite/ 前端项目中集成 core/ 的身份认证系统，并打通与 agent/ 的流式 SSE 输出。前端通过 Nginx 网关统一路由，使用相对路径请求 API，Token 通过 Bearer header 传递。

## 2. 架构

```
浏览器 (vite SPA)
  │
  ├── 相对路径请求 → Nginx (网关)
  │     ├── /api/v1/auth/*  → core:8000 (认证)
  │     └── /v1/agent/*     → agent:8001 (流式)
  │
  └── Token 存储在 localStorage
```

### 2.1 现有 Nginx 路由（无需修改）

| 路径前缀 | 目标服务 | 用途 |
|---------|---------|------|
| `/api/v1/` | core:8000 | 认证 API（login, register, refresh, me） |
| `/v1/` | agent:8001 | Agent 流式 API（stream, invoke） |

### 2.2 开发环境代理

Vite dev server 配置 proxy，将请求转发到对应的后端服务：
- `/api/v1` → `http://localhost:8000`
- `/v1` → `http://localhost:8001`

## 3. 前端改动清单

### 3.1 新增认证 API 模块 (`vite/src/api/auth.ts`)

封装认证相关的 HTTP 请求：

```ts
export async function login(email: string, password: string): Promise<TokenResponse>
export async function register(email: string, password: string, nickname: string): Promise<TokenResponse>
export async function refreshToken(refreshToken: string): Promise<TokenResponse>
export async function getMe(): Promise<UserResponse>
```

### 3.2 新增 Token 管理 (`vite/src/lib/auth.ts`)

localStorage 操作封装：

```ts
export function getToken(): string | null
export function setTokens(access: string, refresh: string): void
export function removeTokens(): void
export function getRefreshToken(): string | null
```

### 3.3 修改 Axios 客户端 (`vite/src/api/client.ts`)

- **请求拦截器**：自动附加 `Authorization: Bearer <access_token>`
- **响应拦截器**：401 时清除 token 并触发登出事件

### 3.4 修改流式请求 (`vite/src/api/stream.ts`)

- URL 改为相对路径：`/v1/agent/stream`
- 添加 `Authorization: Bearer <token>` header
- 请求体匹配 agent API 的 `StreamInput` 格式

### 3.5 修改 useStreamSSE hook (`vite/src/hooks/useStreamSSE.ts`)

- `startStream` 方法自动读取并附加 token
- 支持传入自定义 headers

### 3.6 修改 useChat hook (`vite/src/hooks/useChat.ts`)

- 流式端点改为 `/v1/agent/stream`
- 请求体格式对齐 agent API：
  ```ts
  {
    message: string,
    thread_id: string | null,  // 原 conversation_id
    stream_tokens: true,
    agent_id?: string,
    model?: string
  }
  ```

### 3.7 新增 Vite dev proxy (`vite/vite.config.ts`)

```ts
server: {
  proxy: {
    '/api/v1': { target: 'http://localhost:8000', changeOrigin: true },
    '/v1': {
      target: 'http://localhost:8001',
      changeOrigin: true,
      // SSE 流式配置
      configure: (proxy) => {
        proxy.on('proxyRes', (proxyRes) => {
          proxyRes.headers['cache-control'] = 'no-cache';
          proxyRes.headers['connection'] = 'keep-alive';
        });
      }
    }
  }
}
```

## 4. 数据流

### 4.1 认证流程

```
1. 用户输入邮箱/密码 → POST /api/v1/auth/login
2. core 验证 → 返回 { access_token, refresh_token }
3. 前端存储到 localStorage
4. 后续请求自动携带 Bearer token
```

### 4.2 流式聊天流程

```
1. 用户发送消息
2. 读取 localStorage 中的 access_token
3. POST /v1/agent/stream，body 包含 message + thread_id
4. agent 验证 token（共享 AUTH_SECRET）
5. agent 返回 SSE 流：data: {"type": "token", "content": "..."}
6. 前端逐块解析，追加到 assistant 消息
7. 收到 data: [DONE] 时结束流
```

## 5. 错误处理

| 场景 | 处理方式 |
|------|---------|
| 401 未授权 | 清除 token，重定向到登录页 |
| Token 过期 | 尝试 refresh token，失败则登出 |
| 流式中断 | 显示错误提示，允许重试 |
| 网络错误 | toast 提示用户 |
| SSE 解析失败 | 忽略该行，继续处理后续数据 |

## 6. 类型定义

### 6.1 认证相关类型 (`vite/src/api/types.ts` 扩展)

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
```

### 6.2 流式请求类型

```ts
export interface StreamRequest {
  message: string
  thread_id: string | null
  stream_tokens?: boolean
  agent_id?: string
  model?: string
}
```

## 7. 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `vite/src/api/auth.ts` | 新增 | 认证 API 封装 |
| `vite/src/lib/auth.ts` | 新增 | Token 管理工具 |
| `vite/src/api/client.ts` | 修改 | 添加 Bearer token 拦截器 |
| `vite/src/api/stream.ts` | 修改 | 相对路径 + token header |
| `vite/src/hooks/useStreamSSE.ts` | 修改 | 自动附加 token |
| `vite/src/hooks/useChat.ts` | 修改 | 对齐 agent API 格式 |
| `vite/src/api/types.ts` | 修改 | 新增认证类型定义 |
| `vite/vite.config.ts` | 修改 | 添加 dev proxy |
| `vite/.env.example` | 修改 | 移除 VITE_API_BASE_URL（改用相对路径） |

## 8. 注意事项

1. **CORS**：开发环境通过 Vite proxy 解决，生产环境由 Nginx 处理
2. **Token 刷新**：当前版本暂不实现自动刷新，401 时直接登出
3. **SSE 缓冲**：Nginx 已配置 `proxy_buffering off`，确保流式响应实时推送
4. **thread_id vs conversation_id**：前端使用 `conversation_id` 作为内部标识，请求 agent 时映射为 `thread_id`
