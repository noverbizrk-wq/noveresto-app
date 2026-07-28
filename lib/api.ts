const API = process.env.NEXT_PUBLIC_API_URL || 'https://noveresto.app'

export async function apiCall(endpoint: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${endpoint}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur API')
  return data
}

export const api = {
  login:     (email: string, password: string) =>
    apiCall('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register:  (data: object) =>
    apiCall('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me:        (token: string) => apiCall('/api/v1/auth/me', {}, token),
  dashboard: (token: string) => apiCall('/api/v1/dashboard', {}, token),
  stocks:    (token: string) => apiCall('/api/v1/stocks', {}, token),
  forecasts: (token: string) => apiCall('/api/v1/forecasts', {}, token),
  orders:    (token: string) => apiCall('/api/v1/orders', {}, token),
  reputation:(token: string) => apiCall('/api/v1/reputation', {}, token),
}
