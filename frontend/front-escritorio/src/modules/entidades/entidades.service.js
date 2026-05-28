import { requestJson, toQuery } from '../../shared/services/api'

const BASE = '/api/escritorio/entidades'

export function listarEntidades(params = {}) {
  return requestJson(`${BASE}${toQuery(params)}`)
}

export function buscarEntidade(id) {
  return requestJson(`${BASE}/${id}`)
}

export function criarEntidade(payload) {
  return requestJson(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarEntidade(id, payload) {
  return requestJson(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function removerEntidade(id) {
  return requestJson(`${BASE}/${id}`, { method: 'DELETE' })
}
