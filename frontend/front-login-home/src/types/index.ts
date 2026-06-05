import type { ReactNode } from 'react'

export type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

export type StatusMessageType = 'error' | 'success' | 'warning' | 'info'

export type StatusMessageState = {
  type?: StatusMessageType
  message?: ReactNode
} | null

export type AdminModuleId = string

export type PermissionModule = {
  modulo: AdminModuleId
  pode_visualizar?: boolean
  pode_criar?: boolean
  pode_editar?: boolean
  pode_excluir?: boolean
  pode_restaurar?: boolean
}

export type AuthUser = {
  usuario_id: number
  nome?: string
  email?: string
  observacao?: string | null
  imagem_perfil_url?: string | null
  possuiAdmin?: boolean
  possuiGerente?: boolean
  modulos?: PermissionModule[]
  [key: string]: unknown
}

export type AuthSession = {
  token: string
  usuario: AuthUser
}

export type Credentials = {
  email: string
  senha: string
}

export type AccessRequestPayload = Credentials & {
  nome: string
  modulos_solicitados: string[]
}

export type FirstAccountPayload = Credentials & {
  nome: string
}

export type AdminAccount = {
  id_conta: number
  email: string
  ativo: boolean
  usuario?: {
    nome?: string
  }
  modulos?: PermissionModule[]
}

export type AccessRequest = {
  id_solicitacao_conta: number
  nome: string
  email: string
  modulos_solicitados?: unknown
}

export type PageMeta<TItem = unknown> = {
  items: TItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}
