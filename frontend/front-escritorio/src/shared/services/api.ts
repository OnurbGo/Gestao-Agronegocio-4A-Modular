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

export function normalizePaginated(payload, fallbackLimit = 20) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: fallbackLimit,
      totalPages: 1,
    }
  }

  return {
    items: payload?.items || [],
    total: payload?.total || 0,
    page: payload?.page || 1,
    limit: payload?.limit || fallbackLimit,
    totalPages: payload?.totalPages || 1,
  }
}

function traduzirErro(msg) {
  if (typeof msg !== 'string') return String(msg)

  if (/property \w+ should not exist/.test(msg))
    return 'Campo desconhecido enviado ao servidor'
  if (/\w+ should not be empty/.test(msg))
    return 'Campo obrigatório não preenchido'
  if (/\w+ must be a string/.test(msg))
    return 'Valor inválido: deve ser texto'
  if (/\w+ must be longer than or equal to (\d+) characters/.test(msg)) {
    const n = msg.match(/(\d+)/)?.[1]
    return `Mínimo de ${n} caracteres`
  }
  if (/\w+ must be an integer number/.test(msg))
    return 'Deve ser um número inteiro'
  if (/\w+ must be a number/.test(msg))
    return 'Deve ser um número válido'
  if (/\w+ must not be less than (\d+)/.test(msg)) {
    const n = msg.match(/(\d+)/)?.[1]
    return `Valor mínimo: ${n}`
  }
  if (/\w+ must be a valid enum value/.test(msg))
    return 'Valor selecionado inválido'
  if (/\w+ must be a boolean/.test(msg))
    return 'Valor deve ser verdadeiro ou falso'

  return msg
}

function getIssueMessage(issue) {
  if (!issue) {
    return null
  }

  const field = issue.field || issue.path
  const message = issue.message || issue

  return field ? `${field}: ${message}` : String(message)
}

function getErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback
  }

  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.map(getIssueMessage).filter(Boolean).join('\n')
  }

  if (Array.isArray(payload.message)) {
    return [...new Set(payload.message.map(traduzirErro))].filter(Boolean).join('\n')
  }

  if (payload.message && typeof payload.message === 'object') {
    return getErrorMessage(payload.message, fallback)
  }

  if (typeof payload.message === 'string') {
    return traduzirErro(payload.message)
  }

  if (typeof payload.error === 'string') {
    return payload.error
  }

  return fallback
}

export async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, 'Nao foi possivel concluir a requisicao.'),
    )
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
    throw new Error(
      getErrorMessage(payload, 'Nao foi possivel concluir a requisicao.'),
    )
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
    throw new Error(
      getErrorMessage(payload, 'Nao foi possivel exportar o arquivo.'),
    )
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
