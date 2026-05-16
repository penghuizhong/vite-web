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
