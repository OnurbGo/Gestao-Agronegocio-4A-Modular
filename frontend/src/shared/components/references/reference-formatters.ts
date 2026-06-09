import type { EntidadeReferencia, ImovelReferencia } from '@/shared/types'

export function getEntidadeDocumento(entidade?: EntidadeReferencia | null) {
  return entidade?.cpf_cnpj || entidade?.documento || ''
}

export function getEntidadeLabel(entidade?: EntidadeReferencia | null) {
  if (!entidade) return ''
  const documento = getEntidadeDocumento(entidade)
  return [entidade.nome, documento].filter(Boolean).join(' - ')
}

export function getImovelLabel(imovel?: ImovelReferencia | null) {
  if (!imovel) return ''
  const lote = imovel.lote || imovel.n_lote
  const municipio = imovel.municipio || imovel.cidade
  return [imovel.nome, lote ? `Lote ${lote}` : '', municipio]
    .filter(Boolean)
    .join(' - ')
}
