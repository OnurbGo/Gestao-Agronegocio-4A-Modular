import { downloadFile, requestJson, toQuery } from '../../shared/services/api'

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

export function criarFerias(id, payload) {
  return requestJson(`/api/escritorio/folha/participantes/${id}/ferias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
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
