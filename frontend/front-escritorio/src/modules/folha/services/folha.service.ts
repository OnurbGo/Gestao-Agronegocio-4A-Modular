import { downloadFile, requestJson, toQuery } from '@/shared/services/api'

export function listarParticipantes(params = {}) {
  return requestJson(`/api/escritorio/folha/participantes${toQuery(params)}`)
}

export function buscarParticipante(id) {
  return requestJson(`/api/escritorio/folha/participantes/${id}`)
}

export function listarLancamentosMensais(id, ano) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/lancamentos-mensais${toQuery({ ano })}`,
  )
}

export function listarRegistrosSalariais(id, params = {}) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/registros-salariais${toQuery(params)}`,
  )
}

export function buscarPercentualSugerido(id, params) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/percentual-sugerido${toQuery(params)}`,
  )
}

export function buscarImpactoEdicaoRegistroSalarial(id, registroId, payload) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}/impacto-edicao`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function buscarImpactoExclusaoRegistroSalarial(id, registroId) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}/impacto-exclusao`,
  )
}

export function salvarLancamentosMensais(id, ano, linhas) {
  return requestJson(`/api/escritorio/folha/participantes/${id}/lancamentos-mensais`, {
    method: 'PUT',
    body: JSON.stringify({ ano, linhas }),
  })
}

export function exportarLancamentosMensais(id, ano, nome) {
  const filename = `folha-${nome || id}-${ano}.xlsx`
  return downloadFile(
    `/api/escritorio/folha/participantes/${id}/lancamentos-mensais/exportar${toQuery({
      ano,
    })}`,
    filename,
  )
}

export function criarRegistroSalarial(id, payload) {
  return requestJson(`/api/escritorio/folha/participantes/${id}/registros-salariais`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarRegistroSalarial(id, registroId, payload) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export function removerRegistroSalarial(id, registroId) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}`,
    {
      method: 'DELETE',
    },
  )
}

export function criarFerias(id, payload) {
  return requestJson(`/api/escritorio/folha/participantes/${id}/ferias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarFerias(id, feriasId, payload) {
  return requestJson(`/api/escritorio/folha/participantes/${id}/ferias/${feriasId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function removerFerias(id, feriasId) {
  return requestJson(`/api/escritorio/folha/participantes/${id}/ferias/${feriasId}`, {
    method: 'DELETE',
  })
}

export function listarFerias(id, params = {}) {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/ferias${toQuery(params)}`,
  )
}

export function buscarRelatorioMensal(params) {
  return requestJson(`/api/escritorio/folha/relatorios/mensal${toQuery(params)}`)
}

export function exportarRelatorioMensal(params) {
  return downloadFile(
    `/api/escritorio/folha/relatorios/mensal/exportar${toQuery(params)}`,
    `relatorio-folha-${params.ano}-${String(params.mes).padStart(2, '0')}.xlsx`,
  )
}
