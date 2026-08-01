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

  // ── Module "Gestion du restaurant" (Lot 1) ────────────────────────────────
  restaurantContext: (token: string) =>
    apiCall('/api/v1/restaurant/context', {}, token),
  restaurantChannels: (token: string) =>
    apiCall('/api/v1/restaurant/channels', {}, token),
  restaurantOrders: (token: string, restaurantId: number, status?: string) =>
    apiCall(`/api/v1/restaurant/orders?restaurant_id=${restaurantId}${status ? `&status=${status}` : ''}`, {}, token),
  restaurantOrderStatus: (token: string, orderId: number, restaurantId: number, status: string) =>
    apiCall(`/api/v1/restaurant/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, status })
    }, token),
  restaurantKdsQueue: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/kds/queue?restaurant_id=${restaurantId}`, {}, token),
  restaurantDashboardSummary: (token: string, restaurantId: number, from: string, to: string) =>
    apiCall(`/api/v1/restaurant/dashboard/summary?restaurant_id=${restaurantId}&from=${from}&to=${to}`, {}, token),
  restaurantMenuItems: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/menu-items?restaurant_id=${restaurantId}`, {}, token),
  restaurantMenuItemAvailability: (token: string, itemId: number, restaurantId: number, isAvailable: boolean) =>
    apiCall(`/api/v1/restaurant/menu-items/${itemId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, is_available: isAvailable })
    }, token),
}
