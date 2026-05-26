import { downloadFile, requestJson, toQuery } from '../../shared/services/api'

export function listarParticipantes(params = {}) {
  return requestJson(`/folha/participantes${toQuery(params)}`)
}

export function buscarParticipante(id) {
  return requestJson(`/folha/participantes/${id}`)
}

export function listarLancamentosMensais(id, ano) {
  return requestJson(
    `/folha/participantes/${id}/lancamentos-mensais${toQuery({ ano })}`,
  )
}

export function salvarLancamentosMensais(id, ano, linhas) {
  return requestJson(`/folha/participantes/${id}/lancamentos-mensais`, {
    method: 'PUT',
    body: JSON.stringify({ ano, linhas }),
  })
}

export function exportarLancamentosMensais(id, ano, nome) {
  const filename = `folha-${nome || id}-${ano}.xlsx`
  return downloadFile(
    `/folha/participantes/${id}/lancamentos-mensais/exportar${toQuery({
      ano,
    })}`,
    filename,
  )
}

export function criarRegistroSalarial(id, payload) {
  return requestJson(`/folha/participantes/${id}/registros-salariais`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function criarFerias(id, payload) {
  return requestJson(`/folha/participantes/${id}/ferias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function buscarRelatorioMensal(params) {
  return requestJson(`/folha/relatorios/mensal${toQuery(params)}`)
}

export function exportarRelatorioMensal(params) {
  return downloadFile(
    `/folha/relatorios/mensal/exportar${toQuery(params)}`,
    `relatorio-folha-${params.ano}-${String(params.mes).padStart(2, '0')}.xlsx`,
  )
}
