import { requestJson, toQuery } from '@/services/api'
import type {
  AreaLoteReferencia,
  EntidadeReferencia,
  ImovelReferencia,
  PaginatedResponse,
  QueryParams,
  SafraReferencia,
} from '@/types'

export function listarEntidadesReferencia(
  params: QueryParams = {},
): Promise<PaginatedResponse<EntidadeReferencia> | EntidadeReferencia[]> {
  return requestJson<
    PaginatedResponse<EntidadeReferencia> | EntidadeReferencia[]
  >(`/api/escritorio/entidades${toQuery(params)}`)
}

export function buscarEntidadeReferencia(
  id: number,
): Promise<EntidadeReferencia> {
  return requestJson<EntidadeReferencia>(`/api/escritorio/entidades/${id}`)
}

export function listarImoveisReferencia(
  params: QueryParams = {},
): Promise<PaginatedResponse<ImovelReferencia> | ImovelReferencia[]> {
  return requestJson<PaginatedResponse<ImovelReferencia> | ImovelReferencia[]>(
    `/api/escritorio/imoveis${toQuery(params)}`,
  )
}

export function buscarImovelReferencia(id: number): Promise<ImovelReferencia> {
  return requestJson<ImovelReferencia>(`/api/escritorio/imoveis/${id}`)
}

export function listarAreasLoteReferencia(
  _params: QueryParams = {},
): Promise<PaginatedResponse<AreaLoteReferencia> | AreaLoteReferencia[]> {
  // TODO: conectar quando o módulo Escritório expuser endpoint de área/lote.
  return Promise.resolve([])
}

export function listarSafrasReferencia(
  _params: QueryParams = {},
): Promise<PaginatedResponse<SafraReferencia> | SafraReferencia[]> {
  // TODO: conectar quando o módulo Escritório expuser endpoint de safra.
  return Promise.resolve([])
}
