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

  // ── Lot 2 : ingrédients, recettes, coûts ──────────────────────────────────
  restaurantIngredients: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/ingredients?restaurant_id=${restaurantId}`, {}, token),
  restaurantIngredientCreate: (token: string, restaurantId: number, data: object) =>
    apiCall('/api/v1/restaurant/ingredients', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantIngredientUpdate: (token: string, ingredientId: number, restaurantId: number, data: object) =>
    apiCall(`/api/v1/restaurant/ingredients/${ingredientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantLowStockAlerts: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/ingredients/alerts/low-stock?restaurant_id=${restaurantId}`, {}, token),

  restaurantRecipeIngredients: (token: string, restaurantId: number, menuItemId: number) =>
    apiCall(`/api/v1/restaurant/recipe-ingredients?restaurant_id=${restaurantId}&menu_item_id=${menuItemId}`, {}, token),
  restaurantRecipeIngredientAdd: (token: string, restaurantId: number, menuItemId: number, ingredientId: number, quantity: number) =>
    apiCall('/api/v1/restaurant/recipe-ingredients', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, menu_item_id: menuItemId, ingredient_id: ingredientId, quantity })
    }, token),
  restaurantRecipeIngredientDelete: (token: string, recipeIngredientId: number, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/recipe-ingredients/${recipeIngredientId}?restaurant_id=${restaurantId}`, {
      method: 'DELETE'
    }, token),

  restaurantMenuItemCost: (token: string, restaurantId: number, menuItemId: number) =>
    apiCall(`/api/v1/restaurant/menu-items/${menuItemId}/cost?restaurant_id=${restaurantId}`, {}, token),
  restaurantCostsSummary: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/costs/summary?restaurant_id=${restaurantId}`, {}, token),

  // ── Lot 2 : stocks ─────────────────────────────────────────────────────────
  restaurantStockMovements: (token: string, restaurantId: number, ingredientId?: number) =>
    apiCall(`/api/v1/restaurant/stock-movements?restaurant_id=${restaurantId}${ingredientId ? `&ingredient_id=${ingredientId}` : ''}`, {}, token),
  restaurantStockAdjust: (token: string, restaurantId: number, ingredientId: number, quantityDelta: number, note?: string) =>
    apiCall('/api/v1/restaurant/stock-movements/adjust', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, ingredient_id: ingredientId, quantity_delta: quantityDelta, note })
    }, token),

  // ── Lot 2 : achats et fournisseurs ─────────────────────────────────────────
  restaurantPurchaseOrders: (token: string, restaurantId: number, status?: string) =>
    apiCall(`/api/v1/restaurant/purchase-orders?restaurant_id=${restaurantId}${status ? `&status=${status}` : ''}`, {}, token),
  restaurantPurchaseOrderDetail: (token: string, id: number, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/purchase-orders/${id}?restaurant_id=${restaurantId}`, {}, token),
  restaurantPurchaseOrderCreate: (token: string, restaurantId: number, supplierId: number | null, items: object[]) =>
    apiCall('/api/v1/restaurant/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, supplier_id: supplierId, items })
    }, token),
  restaurantPurchaseOrderReceive: (token: string, id: number, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/purchase-orders/${id}/receive`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId })
    }, token),

  restaurantSuppliers: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/suppliers?restaurant_id=${restaurantId}`, {}, token),
  restaurantSupplierCreate: (token: string, restaurantId: number, data: object) =>
    apiCall('/api/v1/restaurant/suppliers', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),

  // ── Lot 3 : personnel et planning ──────────────────────────────────────────
  restaurantEmployees: (token: string, restaurantId: number, active?: boolean) =>
    apiCall(`/api/v1/restaurant/employees?restaurant_id=${restaurantId}${active !== undefined ? `&active=${active}` : ''}`, {}, token),
  restaurantEmployeeCreate: (token: string, restaurantId: number, data: object) =>
    apiCall('/api/v1/restaurant/employees', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantEmployeeUpdate: (token: string, employeeId: number, restaurantId: number, data: object) =>
    apiCall(`/api/v1/restaurant/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),

  restaurantShifts: (token: string, restaurantId: number, from?: string, to?: string) =>
    apiCall(`/api/v1/restaurant/shifts?restaurant_id=${restaurantId}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`, {}, token),
  restaurantShiftCreate: (token: string, restaurantId: number, data: object) =>
    apiCall('/api/v1/restaurant/shifts', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantShiftUpdate: (token: string, shiftId: number, restaurantId: number, data: object) =>
    apiCall(`/api/v1/restaurant/shifts/${shiftId}`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantShiftDelete: (token: string, shiftId: number, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/shifts/${shiftId}?restaurant_id=${restaurantId}`, {
      method: 'DELETE'
    }, token),

  // ── Lot 3 : litiges ─────────────────────────────────────────────────────────
  restaurantDisputes: (token: string, restaurantId: number, status?: string) =>
    apiCall(`/api/v1/restaurant/disputes?restaurant_id=${restaurantId}${status ? `&status=${status}` : ''}`, {}, token),
  restaurantDisputeDetail: (token: string, id: number, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/disputes/${id}?restaurant_id=${restaurantId}`, {}, token),
  restaurantDisputesSummary: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/disputes/summary?restaurant_id=${restaurantId}`, {}, token),
  restaurantDisputeCreate: (token: string, restaurantId: number, data: object) =>
    apiCall('/api/v1/restaurant/disputes', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantDisputeStatus: (token: string, id: number, restaurantId: number, status: string, amountRefunded?: number) =>
    apiCall(`/api/v1/restaurant/disputes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, status, amount_refunded: amountRefunded })
    }, token),
  restaurantDisputeEvidence: (token: string, id: number, restaurantId: number, photoUrl: string, note?: string) =>
    apiCall(`/api/v1/restaurant/disputes/${id}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, photo_url: photoUrl, note })
    }, token),

  // ── Lot 4 : finance et TVA ──────────────────────────────────────────────────
  restaurantVatBreakdown: (token: string, restaurantId: number, from: string, to: string) =>
    apiCall(`/api/v1/restaurant/finance/vat-breakdown?restaurant_id=${restaurantId}&from=${from}&to=${to}`, {}, token),
  restaurantChannelBreakdown: (token: string, restaurantId: number, from: string, to: string) =>
    apiCall(`/api/v1/restaurant/finance/channel-breakdown?restaurant_id=${restaurantId}&from=${from}&to=${to}`, {}, token),
  restaurantExportCsvUrl: (restaurantId: number, from: string, to: string) =>
    `/api/v1/restaurant/finance/export.csv?restaurant_id=${restaurantId}&from=${from}&to=${to}`,

  // ── Lot 5 : copilote IA ──────────────────────────────────────────────────────
  restaurantCopilotContext: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/copilot/context?restaurant_id=${restaurantId}`, {}, token),
  restaurantCopilotRecommendations: (token: string, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/copilot/recommendations?restaurant_id=${restaurantId}`, {}, token),
  restaurantCopilotAsk: (token: string, restaurantId: number, question: string) =>
    apiCall('/api/v1/restaurant/copilot/ask', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, question })
    }, token),

  // ── Lot 7 : permissions par module ────────────────────────────────────────
  restaurantMyModules: (token: string) =>
    apiCall('/api/v1/restaurant/my-modules', {}, token),
  adminModulesReference: (token: string) =>
    apiCall('/api/v1/admin/modules', {}, token),
  adminClientsAccess: (token: string) =>
    apiCall('/api/v1/admin/clients-access', {}, token),
  adminSetClientModules: (token: string, userId: number, modules: string[]) =>
    apiCall(`/api/v1/admin/clients/${userId}/modules`, {
      method: 'PUT',
      body: JSON.stringify({ modules })
    }, token),

  // ── Lot 9 : prospection ─────────────────────────────────────────────────────
  restaurantProspectionSearch: (token: string, restaurantId: number, zoneLabel: string, category: string) =>
    apiCall('/api/v1/restaurant/prospection/search', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, zone_label: zoneLabel, category })
    }, token),
  restaurantProspectionSearchByMap: (token: string, restaurantId: number, latitude: number, longitude: number, radiusKm: number, category: string) =>
    apiCall('/api/v1/restaurant/prospection/search', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, latitude, longitude, radius_km: radiusKm, category })
    }, token),
  restaurantProspectionList: (token: string, restaurantId: number, tier?: string, status?: string) =>
    apiCall(`/api/v1/restaurant/prospection/list?restaurant_id=${restaurantId}${tier ? `&tier=${tier}` : ''}${status ? `&status=${status}` : ''}`, {}, token),
  restaurantProspectionUpdate: (token: string, id: number, restaurantId: number, data: { status?: string; notes?: string; contact_name?: string; next_action_date?: string | null }) =>
    apiCall(`/api/v1/restaurant/prospection/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantProspectionInteractions: (token: string, id: number, restaurantId: number) =>
    apiCall(`/api/v1/restaurant/prospection/${id}/interactions?restaurant_id=${restaurantId}`, {}, token),
  restaurantProspectionAddInteraction: (token: string, id: number, restaurantId: number, note: string) =>
    apiCall(`/api/v1/restaurant/prospection/${id}/interactions`, {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, note })
    }, token),
  restaurantProspectionExportCsvUrl: (restaurantId: number, tier?: string, status?: string) =>
    `/api/v1/restaurant/prospection/export.csv?restaurant_id=${restaurantId}${tier ? `&tier=${tier}` : ''}${status ? `&status=${status}` : ''}`,

  // ── Diagnostic public (pas d'authentification) ────────────────────────────
  publicDiagnostic: (businessName: string, city: string) =>
    apiCall('/api/v1/public/diagnostic', {
      method: 'POST',
      body: JSON.stringify({ business_name: businessName, city })
    }),

  // ── Facturation électronique TEIF (Lot 12) ──────────────────────────────────
  restaurantTaxProfileUpdate: (token: string, restaurantId: number, data: { tax_id?: string; address?: string; city?: string; postal_code?: string }) =>
    apiCall('/api/v1/restaurant/tax-profile', {
      method: 'PATCH',
      body: JSON.stringify({ restaurant_id: restaurantId, ...data })
    }, token),
  restaurantTeifCreate: (token: string, restaurantId: number, orderId: number, customer: { customer_tax_id: string; customer_name: string; customer_address?: string; customer_city?: string; customer_postal_code?: string }) =>
    apiCall(`/api/v1/restaurant/orders/${orderId}/teif-invoice`, {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, ...customer })
    }, token),
  restaurantTeifGet: (token: string, restaurantId: number, orderId: number) =>
    apiCall(`/api/v1/restaurant/orders/${orderId}/teif-invoice?restaurant_id=${restaurantId}`, {}, token),
  restaurantTeifDownloadUrl: (restaurantId: number, orderId: number) =>
    `/api/v1/restaurant/orders/${orderId}/teif-invoice/download?restaurant_id=${restaurantId}`,

  // ── Pitch IA prospection ─────────────────────────────────────────────────
  restaurantProspectPitch: (token: string, restaurantId: number, prospectId: number) =>
    apiCall(`/api/v1/restaurant/prospects/${prospectId}/pitch`, {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId })
    }, token),
}
