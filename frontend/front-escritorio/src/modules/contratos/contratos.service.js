import { requestJson, toQuery } from '../../shared/services/api'

const BASE = '/api/escritorio/contratos'

export function listarContratos(params = {}) {
  return requestJson(`${BASE}${toQuery(params)}`)
}

export function buscarContrato(id) {
  return requestJson(`${BASE}/${id}`)
}

export function criarContrato(payload) {
  return requestJson(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarContrato(id, payload) {
  return requestJson(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function removerContrato(id) {
  return requestJson(`${BASE}/${id}`, { method: 'DELETE' })
}
