// 文件路径：src/lib/env.ts

let baseUrl = import.meta.env.VITE_API_BASE_URL || ''

// 1. 剥离引号
baseUrl = baseUrl.replace(/["']/g, '')

// 2. 修复斜杠
if (baseUrl.startsWith('https:/') && !baseUrl.startsWith('https://')) {
  baseUrl = baseUrl.replace('https:/', 'https://')
} else if (baseUrl.startsWith('http:/') && !baseUrl.startsWith('http://')) {
  baseUrl = baseUrl.replace('http:/', 'http://')
}

// 3. 终极兜底
if (!baseUrl) {
  if (import.meta.env.DEV) {
    baseUrl = ''
  } else {
    baseUrl = 'https://api.fyzj.online'
  }
}

baseUrl = baseUrl.replace(/\/$/, '')
// 🎯 核心：导出这个只会在页面加载时计算一次的纯净常量
export const API_BASE_URL = baseUrl
