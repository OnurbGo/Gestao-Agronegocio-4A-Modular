import { requestJson, toQuery } from '@/shared/services/api'

const BASE = '/api/escritorio/imoveis'

export function listarImoveis(params = {}) {
  return requestJson(`${BASE}${toQuery(params)}`)
}

export function buscarImovel(id) {
  return requestJson(`${BASE}/${id}`)
}

export function criarImovel(payload) {
  return requestJson(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarImovel(id, payload) {
  return requestJson(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function removerImovel(id) {
  return requestJson(`${BASE}/${id}`, { method: 'DELETE' })
}
