import { requestJson, toQuery } from '@/shared/services/api'
import type {
  Imovel,
  ImovelFormData,
  PaginatedResponse,
  QueryParams,
} from '@/shared/types'

const BASE = '/api/escritorio/imoveis'

export function listarImoveis(
  params: QueryParams = {},
): Promise<PaginatedResponse<Imovel> | Imovel[]> {
  return requestJson<PaginatedResponse<Imovel> | Imovel[]>(
    `${BASE}${toQuery(params)}`,
  )
}

export function buscarImovel(id: number): Promise<Imovel> {
  return requestJson<Imovel>(`${BASE}/${id}`)
}

export function criarImovel(payload: ImovelFormData): Promise<Imovel> {
  return requestJson<Imovel>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarImovel(
  id: number,
  payload: ImovelFormData,
): Promise<Imovel> {
  return requestJson<Imovel>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function removerImovel(id: number): Promise<unknown> {
  return requestJson(`${BASE}/${id}`, { method: 'DELETE' })
}
