import {
  downloadFile,
  requestFormData,
  requestJson,
  toQuery,
} from '../../shared/services/api'

const BASE = '/api/escritorio'

export function listarTiposDocumento() {
  return requestJson(`${BASE}/tipos-documento`)
}

export function listarArquivosEntidade(id) {
  return requestJson(`${BASE}/entidades/${id}/arquivos`)
}

export function listarArquivosImovel(id) {
  return requestJson(`${BASE}/imoveis/${id}/arquivos`)
}

export function enviarArquivoEntidade(id, formData) {
  return requestFormData(`${BASE}/entidades/${id}/arquivos`, formData)
}

export function enviarArquivoImovel(id, formData) {
  return requestFormData(`${BASE}/imoveis/${id}/arquivos`, formData)
}

export function baixarArquivo(id, origem, nome) {
  return downloadFile(
    `${BASE}/arquivos/${id}/download${toQuery({ origem })}`,
    nome || `arquivo-${id}`,
  )
}

export function removerArquivo(id, origem) {
  return requestJson(`${BASE}/arquivos/${id}${toQuery({ origem })}`, {
    method: 'DELETE',
  })
}
