import type { PaginatedResponse, QueryParams } from '@/types'

export type { PaginatedResponse, QueryParams } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'gestao_agro_token'

type ApiEnvelope<TData> = {
  data?: TData
  errors?: unknown
  message?: unknown
  error?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken')
  )
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem('token', token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('authToken')
  localStorage.removeItem('accessToken')
}

export function consumeAccessTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('access_token') || params.get('token')

  if (!token) return

  setToken(token)
  params.delete('access_token')
  params.delete('token')

  const query = params.toString()
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', nextUrl)
}

function getHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  const token = getToken()

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
}

export function toQuery(params: QueryParams = {}): string {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export function normalizePaginated<TItem>(
  payload: PaginatedResponse<TItem> | TItem[] | null | undefined,
  fallbackLimit = 20,
): PaginatedResponse<TItem> {
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

function traduzirErro(msg: unknown): string {
  if (typeof msg !== 'string') return String(msg)

  if (/property \w+ should not exist/.test(msg)) return 'Campo desconhecido enviado ao servidor'
  if (/\w+ should not be empty/.test(msg)) return 'Campo obrigatório não preenchido'
  if (/\w+ must be a string/.test(msg)) return 'Valor invalido: deve ser texto'
  if (/\w+ must be an integer number/.test(msg)) return 'Deve ser um numero inteiro'
  if (/\w+ must be a number/.test(msg)) return 'Deve ser um numero valido'
  if (/\w+ must be a valid enum value/.test(msg)) return 'Valor selecionado invalido'
  if (/\w+ must be a boolean/.test(msg)) return 'Valor deve ser verdadeiro ou falso'

  return msg
}

function getIssueMessage(issue: unknown): string | null {
  if (!issue) return null
  const field = isRecord(issue) ? issue.field || issue.path : undefined
  const message = isRecord(issue) ? issue.message || issue : issue
  return field ? `${field}: ${message}` : String(message)
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback

  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.map(getIssueMessage).filter(Boolean).join('\n')
  }

  if (Array.isArray(payload.message)) {
    return [...new Set(payload.message.map(traduzirErro))]
      .filter(Boolean)
      .join('\n')
  }

  if (payload.message && typeof payload.message === 'object') {
    return getErrorMessage(payload.message, fallback)
  }

  if (typeof payload.message === 'string') return traduzirErro(payload.message)
  if (typeof payload.error === 'string') return payload.error

  return fallback
}

export async function requestJson<TData = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<TData> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  })

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<TData>
    | TData
    | null

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, 'Não foi possível concluir a requisição.'),
    )
  }

  return (isRecord(payload) && 'data' in payload ? payload.data : payload) as TData
}
