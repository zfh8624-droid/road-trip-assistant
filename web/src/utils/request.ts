const BASE_URL = import.meta.env.VITE_API_BASE || ''

function getToken(): string | null {
  return localStorage.getItem('xingye-token')
}

export interface ApiResp<T = any> {
  ok: boolean
  data?: T
  error?: string
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<ApiResp<T>> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    const json = await res.json()
    if (!res.ok || json.error) {
      return { ok: false, error: json.error || `请求失败 (${res.status})` }
    }
    return { ok: true, data: json.data ?? json }
  } catch (e: any) {
    return { ok: false, error: e?.message || '网络异常，请确认后端已启动' }
  }
}

export const http = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
}
