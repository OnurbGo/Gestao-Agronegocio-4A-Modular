const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'gestao_agro_token'

export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken')
  )
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('authToken')
  localStorage.removeItem('accessToken')
}

export function consumeAccessTokenFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('access_token') || params.get('token')

  if (!token) {
    return
  }

  setToken(token)
  params.delete('access_token')
  params.delete('token')

  const query = params.toString()
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', nextUrl)
}

function getHeaders(extraHeaders = {}) {
  const token = getToken()

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken()

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
}

function getFilename(response, fallback) {
  const disposition = response.headers.get('Content-Disposition')
  const match = disposition?.match(/filename="?([^"]+)"?/i)
  return match?.[1] || fallback
}

export function toQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.errors?.[0]?.message ||
      'Nao foi possivel concluir a requisicao.'
    throw new Error(message)
  }

  return payload?.data ?? payload
}

export async function requestFormData(path, formData, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: options.method || 'POST',
    body: formData,
    headers: getAuthHeaders(options.headers),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.errors?.[0]?.message ||
      'Nao foi possivel concluir a requisicao.'
    throw new Error(message)
  }

  return payload?.data ?? payload
}

export async function downloadFile(path, fallbackFilename) {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || 'Nao foi possivel exportar o arquivo.')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = getFilename(response, fallbackFilename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
