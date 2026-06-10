import { requestJson, toQuery } from '@/shared/services/api'
import type {
  Entidade,
  EntidadeFormData,
  PaginatedResponse,
  QueryParams,
} from '@/shared/types'

const BASE = '/api/escritorio/entidades'

export function listarEntidades(
  params: QueryParams = {},
): Promise<PaginatedResponse<Entidade> | Entidade[]> {
  return requestJson<PaginatedResponse<Entidade> | Entidade[]>(
    `${BASE}${toQuery(params)}`,
  )
}

export function buscarEntidade(id: number): Promise<Entidade> {
  return requestJson<Entidade>(`${BASE}/${id}`)
}

export function criarEntidade(
  payload: Partial<EntidadeFormData> & Record<string, unknown>,
): Promise<Entidade> {
  return requestJson<Entidade>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarEntidade(
  id: number,
  payload: Partial<EntidadeFormData> & Record<string, unknown>,
): Promise<Entidade> {
  return requestJson<Entidade>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function removerEntidade(id: number): Promise<unknown> {
  return requestJson(`${BASE}/${id}`, { method: 'DELETE' })
}
