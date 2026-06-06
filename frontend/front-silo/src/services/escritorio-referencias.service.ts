import { requestJson, toQuery } from '@/services/api'
import type { PaginatedResponse, QueryParams } from '@/types'

export type ImovelReferencia = {
  id_imovel: number
  nome?: string
  lote?: string
  municipio?: string
}

export function listarImoveisReferencia(
  params: QueryParams = {},
): Promise<PaginatedResponse<ImovelReferencia> | ImovelReferencia[]> {
  return requestJson<PaginatedResponse<ImovelReferencia> | ImovelReferencia[]>(
    `/api/escritorio/imoveis${toQuery(params)}`,
  )
}

// Area/lote e safra ainda nao possuem endpoint confirmado no modulo Escritorio.
// Manter esta camada isolada evita espalhar chamadas temporarias pelas telas.
