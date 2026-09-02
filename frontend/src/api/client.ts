// Use relative path '/api' to leverage Vite's proxy. 
// This completely bypasses CORS issues in local development!
const API_URL = import.meta.env.VITE_API_URL || '/api'

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token')
  
  let activeOrgId: string | null = null
  try {
    const storeState = JSON.parse(localStorage.getItem('persist:root') || '{}')
    activeOrgId = storeState.org?.activeOrganizationId || localStorage.getItem('activeOrgId')
  } catch (e) { /* ignore parsing errors */ }

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(activeOrgId && { 'X-Organization-Id': activeOrgId }),
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/auth/login'
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || error.message || 'API Request Failed')
  }

  return response.json()
}
