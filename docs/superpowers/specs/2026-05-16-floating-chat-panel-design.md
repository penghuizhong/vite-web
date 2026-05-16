# 浮动聊天面板移植设计文档

**日期**: 2026-05-16
**状态**: 待用户审查

## 概述

将 old-web 项目的苹果风浮动聊天面板 UI 移植到 vite 项目中，采用方案 A：全局浮动组件模式。聊天面板作为全局组件挂载在 AppLayout 中，所有页面均可唤起。

## 核心需求

1. **浮动面板体验** — 右下角气泡按钮，点击展开聊天面板
2. **桌面端尺寸加大** — 500px × 812px（比原 400×650 增加约 1/4）
3. **会话联动** — 发送消息后自动同步到侧边栏会话列表
4. **侧边栏点击展开** — 点击侧边栏任意会话，自动展开浮动面板并加载对应聊天

## 架构设计

### 组件层级

```
AppLayout
├── Sidebar (已有，需修改点击逻辑)
├── Header (已有)
├── main → children (路由页面)
└── GlobalChatPanel (新增)
    ├── ChatBubble (浮动气泡按钮)
    ├── ChatFloatPanel (浮动面板)
    │   ├── PanelHeader (头部：标题 + 清空 + 关闭)
    │   ├── MessageList (消息列表，复用已有组件)
    │   └── ChatInput (输入框，移植 old-web 样式)
    └── WelcomeScreen (空状态，复用已有组件)
```

### 状态管理

**uiStore 新增**:
- `chatPanelOpen: boolean` — 面板展开/收起状态
- `setChatPanelOpen(open: boolean)` — 设置面板状态
- `toggleChatPanel()` — 切换面板状态

**chatStore (已有，无需修改)**:
- `conversations` — 会话列表
- `activeConversationId` — 当前活跃会话 ID
- `createConversation()` — 创建新会话
- `setActiveConversation(id)` — 切换会话
- `sendMessage()` — 发送消息（通过 useChat hook）

### 数据流

| 用户操作 | 状态变化 | UI 响应 |
|---------|---------|--------|
| 点击气泡按钮 | `setChatPanelOpen(true)` | 面板展开动画 |
| 发送消息 | `chatStore.sendMessage()` → 自动创建会话 | 侧边栏新增会话项 |
| 侧边栏点击会话 | `setActiveConversation(id)` + `setChatPanelOpen(true)` | 面板展开并加载对应消息 |
| 点击关闭按钮 | `setChatPanelOpen(false)` | 面板收起为气泡 |

## UI 设计细节

### 浮动气泡按钮

- **位置**: `position: fixed; bottom: 1.5rem; right: 1.5rem`（桌面端 `2rem`）
- **样式**: 圆形，56px，毛玻璃背景，带阴影
- **动画**: 面板展开时气泡缩小并淡出（`scale(0.5)` + `opacity: 0`）

### 浮动面板

- **收起状态**: `width: 56px; height: 56px; border-radius: 50%; opacity: 0`
- **展开状态 (桌面端)**: `width: 500px; height: 812px; border-radius: 2rem`
- **展开状态 (手机端)**: `width: calc(100vw - 3rem); height: 80vh; border-radius: 1.5rem`
- **背景**: `hsl(var(--bg-primary) / 0.85)` + `backdrop-filter: blur(24px)`
- **动画**: 从右下角展开，宽度先展开，高度后延伸，内容延迟显现

### ChatInput (移植 old-web)

- **样式**: 圆角胶囊形输入框，`border-radius: 2rem`
- **功能**: Plus 按钮 + 悬浮菜单、麦克风按钮、发送/停止按钮
- **状态**: 发送按钮根据输入内容切换激活/禁用样式
- **主题色适配**: 使用 vite 项目的 `var(--accent-primary)` 替代 old-web 的 `bg-primary`

### 消息气泡

- **用户消息**: `bg-foreground text-background rounded-2xl rounded-br-sm`
- **AI 消息**: `bg-muted/30 border border-border/50 rounded-2xl rounded-bl-sm`
- **Markdown 渲染**: 复用已有的 `MarkdownRenderer` 组件

## 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/components/chat/GlobalChatPanel.tsx` | 全局浮动聊天面板主组件 |
| `src/components/chat/ChatBubble.tsx` | 浮动气泡按钮组件 |
| `src/components/chat/ChatFloatPanel.tsx` | 浮动面板容器（含动画） |
| `src/components/chat/PanelHeader.tsx` | 面板头部组件 |

### 修改文件

| 文件 | 变更内容 |
|------|---------|
| `src/stores/uiStore.ts` | 新增 `chatPanelOpen` 状态及相关方法 |
| `src/components/layout/AppLayout.tsx` | 挂载 `GlobalChatPanel` 组件 |
| `src/components/layout/Sidebar.tsx` | 点击会话时同时调用 `setChatPanelOpen(true)` |
| `src/components/chat/ChatInput.tsx` | 移植 old-web 样式（圆角胶囊、Plus 菜单等） |
| `src/styles/globals.css` | 新增浮动面板动画 CSS 类 |

### 废弃文件（不再使用）

| 文件 | 说明 |
|------|------|
| `src/pages/ChatPage.tsx` | 路由页面被浮动面板替代，可保留但不再作为主要入口 |

## 主题色适配

old-web 使用 shadcn/ui 的 CSS 变量（如 `--background`, `--primary`），vite 项目使用自定义变量。映射关系如下：

| old-web 变量 | vite 项目变量 |
|-------------|--------------|
| `bg-background` | `var(--bg-primary)` |
| `bg-popover` | `var(--bg-secondary)` |
| `bg-muted` | `var(--bg-tertiary)` |
| `text-foreground` | `var(--text-primary)` |
| `text-muted-foreground` | `var(--text-muted)` |
| `bg-primary` | `var(--accent-primary)` |
| `text-primary-foreground` | `#ffffff` |
| `border-border` | `var(--border-default)` |
| `bg-accent` | `var(--accent-light)` |
| `ring-ring` | `var(--accent-primary)` |

## 动画 CSS

浮动面板的展开/收起动画使用纯 CSS 实现，关键帧逻辑：

**展开**: opacity 立即显现 → width 展开 (0.3s) → height 延伸 (0.3s, 延迟 0.25s) → 内容显现 (延迟 0.35s)

**收起**: height 缩小 (0.3s) → width 缩小 (0.3s, 延迟 0.25s) → border-radius 变圆 (延迟 0.25s) → opacity 淡出 (延迟 0.4s)

## 风险与注意事项

1. **ChatPage 路由处理** — 保留 `/` 路由但内容可为空或重定向，避免路由报错
2. **移动端安全区域** — 输入区需处理 `pb-safe` 适配 iPhone 底部横条
3. **z-index 层级** — 浮动面板 `z-index: 50`，需确保不与 Sidebar (z-40) 冲突
4. **Markdown 渲染** — 确认 `react-markdown` + `remark-gfm` + `rehype-highlight` 已在 vite 项目中安装（已确认）
