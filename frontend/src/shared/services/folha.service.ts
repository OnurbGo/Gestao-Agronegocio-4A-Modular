import {
  downloadFile,
  requestJson,
  toQuery,
} from '@/shared/services/api'
import type {
  PaginatedResponse,
  PayrollLine,
  PayrollLinePayload,
  PayrollMonthlyReport,
  PayrollParticipant,
  QueryParams,
  SalaryImpact,
  SalaryPayload,
  SalaryRecord,
  SuggestedPercentage,
  VacationListPayload,
  VacationPayload,
  VacationRecord,
} from '@/shared/types'

export function listarParticipantes(
  params: QueryParams = {},
): Promise<PaginatedResponse<PayrollParticipant> | PayrollParticipant[]> {
  return requestJson<PaginatedResponse<PayrollParticipant> | PayrollParticipant[]>(
    `/api/escritorio/folha/participantes${toQuery(params)}`,
  )
}

export function buscarParticipante(id: number): Promise<PayrollParticipant> {
  return requestJson<PayrollParticipant>(`/api/escritorio/folha/participantes/${id}`)
}

export function listarLancamentosMensais(
  id: number,
  ano: number,
): Promise<Partial<PayrollLine>[]> {
  return requestJson<Partial<PayrollLine>[]>(
    `/api/escritorio/folha/participantes/${id}/lancamentos-mensais${toQuery({ ano })}`,
  )
}

export function listarRegistrosSalariais(
  id: number,
  params: QueryParams = {},
): Promise<PaginatedResponse<SalaryRecord> | SalaryRecord[]> {
  return requestJson<PaginatedResponse<SalaryRecord> | SalaryRecord[]>(
    `/api/escritorio/folha/participantes/${id}/registros-salariais${toQuery(params)}`,
  )
}

export function buscarPercentualSugerido(
  id: number,
  params: QueryParams,
): Promise<SuggestedPercentage> {
  return requestJson<SuggestedPercentage>(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/percentual-sugerido${toQuery(params)}`,
  )
}

export function buscarImpactoEdicaoRegistroSalarial(
  id: number,
  registroId: number,
  payload: SalaryPayload,
): Promise<SalaryImpact> {
  return requestJson<SalaryImpact>(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}/impacto-edicao`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function buscarImpactoExclusaoRegistroSalarial(
  id: number,
  registroId: number,
): Promise<SalaryImpact> {
  return requestJson<SalaryImpact>(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}/impacto-exclusao`,
  )
}

export function salvarLancamentosMensais(
  id: number,
  ano: number,
  linhas: PayrollLinePayload[],
): Promise<Partial<PayrollLine>[]> {
  return requestJson<Partial<PayrollLine>[]>(`/api/escritorio/folha/participantes/${id}/lancamentos-mensais`, {
    method: 'PUT',
    body: JSON.stringify({ ano, linhas }),
  })
}

export function exportarLancamentosMensais(
  id: number,
  ano: number,
  nome?: string,
): Promise<void> {
  const filename = `folha-${nome || id}-${ano}.xlsx`
  return downloadFile(
    `/api/escritorio/folha/participantes/${id}/lancamentos-mensais/exportar${toQuery({
      ano,
    })}`,
    filename,
  )
}

export function criarRegistroSalarial(
  id: number,
  payload: SalaryPayload,
): Promise<SalaryRecord> {
  return requestJson<SalaryRecord>(`/api/escritorio/folha/participantes/${id}/registros-salariais`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarRegistroSalarial(
  id: number,
  registroId: number,
  payload: SalaryPayload,
): Promise<SalaryRecord> {
  return requestJson<SalaryRecord>(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export function removerRegistroSalarial(
  id: number,
  registroId: number,
): Promise<unknown> {
  return requestJson(
    `/api/escritorio/folha/participantes/${id}/registros-salariais/${registroId}`,
    {
      method: 'DELETE',
    },
  )
}

export function criarFerias(
  id: number,
  payload: VacationPayload,
): Promise<VacationRecord> {
  return requestJson<VacationRecord>(`/api/escritorio/folha/participantes/${id}/ferias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function atualizarFerias(
  id: number,
  feriasId: number,
  payload: VacationPayload,
): Promise<VacationRecord> {
  return requestJson<VacationRecord>(`/api/escritorio/folha/participantes/${id}/ferias/${feriasId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function removerFerias(id: number, feriasId: number): Promise<unknown> {
  return requestJson(`/api/escritorio/folha/participantes/${id}/ferias/${feriasId}`, {
    method: 'DELETE',
  })
}

export function listarFerias(
  id: number,
  params: QueryParams = {},
): Promise<VacationListPayload | VacationRecord[]> {
  return requestJson<VacationListPayload | VacationRecord[]>(
    `/api/escritorio/folha/participantes/${id}/ferias${toQuery(params)}`,
  )
}

export function buscarRelatorioMensal(
  params: QueryParams,
): Promise<PayrollMonthlyReport> {
  return requestJson<PayrollMonthlyReport>(
    `/api/escritorio/folha/relatorios/mensal${toQuery(params)}`,
  )
}

export function exportarRelatorioMensal(params: {
  ano: number
  mes: number
}): Promise<void> {
  return downloadFile(
    `/api/escritorio/folha/relatorios/mensal/exportar${toQuery(params)}`,
    `relatorio-folha-${params.ano}-${String(params.mes).padStart(2, '0')}.xlsx`,
  )
}
