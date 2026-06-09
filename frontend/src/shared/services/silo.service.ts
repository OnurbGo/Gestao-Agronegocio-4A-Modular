import { requestJson, toQuery } from '@/shared/services/api'
import type {
  ContaProduto,
  ContratoSilo,
  DadosSaidaPesagem,
  Deposito,
  Destino,
  Emissor,
  FaixaDesconto,
  ItemSilo,
  LoteOperacional,
  MovimentacaoProduto,
  PaginatedResponse,
  Pesagem,
  QueryParams,
  SaldoContaProduto,
  SaldoDeposito,
  TabelaDesconto,
  Transportadora,
} from '@/shared/types'

const BASE = '/api/silo'

function list<TItem>(path: string, params: QueryParams = {}) {
  return requestJson<PaginatedResponse<TItem> | TItem[]>(
    `${BASE}${path}${toQuery(params)}`,
  )
}

function get<TItem>(path: string, id: number) {
  return requestJson<TItem>(`${BASE}${path}/${id}`)
}

function create<TItem>(path: string, payload: Record<string, unknown>) {
  return requestJson<TItem>(`${BASE}${path}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function update<TItem>(path: string, id: number, payload: Record<string, unknown>) {
  return requestJson<TItem>(`${BASE}${path}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

function remove(path: string, id: number) {
  return requestJson(`${BASE}${path}/${id}`, { method: 'DELETE' })
}

export const contasProdutoApi = {
  list: (params?: QueryParams) => list<ContaProduto>('/contas-produto', params),
  get: (id: number) => get<ContaProduto>('/contas-produto', id),
  create: (payload: Record<string, unknown>) => create<ContaProduto>('/contas-produto', payload),
  update: (id: number, payload: Record<string, unknown>) => update<ContaProduto>('/contas-produto', id, payload),
  remove: (id: number) => remove('/contas-produto', id),
}

export const itensApi = {
  list: (params?: QueryParams) => list<ItemSilo>('/itens', params),
  get: (id: number) => get<ItemSilo>('/itens', id),
  create: (payload: Record<string, unknown>) => create<ItemSilo>('/itens', payload),
  update: (id: number, payload: Record<string, unknown>) => update<ItemSilo>('/itens', id, payload),
  remove: (id: number) => remove('/itens', id),
}

export const transportadorasApi = {
  list: (params?: QueryParams) => list<Transportadora>('/transportadoras', params),
  create: (payload: Record<string, unknown>) => create<Transportadora>('/transportadoras', payload),
  update: (id: number, payload: Record<string, unknown>) => update<Transportadora>('/transportadoras', id, payload),
  remove: (id: number) => remove('/transportadoras', id),
}

export const emissoresApi = {
  list: (params?: QueryParams) => list<Emissor>('/emissores', params),
  create: (payload: Record<string, unknown>) => create<Emissor>('/emissores', payload),
  update: (id: number, payload: Record<string, unknown>) => update<Emissor>('/emissores', id, payload),
  remove: (id: number) => remove('/emissores', id),
}

export const depositosApi = {
  list: (params?: QueryParams) => list<Deposito>('/depositos', params),
  create: (payload: Record<string, unknown>) => create<Deposito>('/depositos', payload),
  update: (id: number, payload: Record<string, unknown>) => update<Deposito>('/depositos', id, payload),
  remove: (id: number) => remove('/depositos', id),
}

export const destinosApi = {
  list: (params?: QueryParams) => list<Destino>('/destinos', params),
  create: (payload: Record<string, unknown>) => create<Destino>('/destinos', payload),
  update: (id: number, payload: Record<string, unknown>) => update<Destino>('/destinos', id, payload),
  remove: (id: number) => remove('/destinos', id),
}

export const lotesApi = {
  list: (params?: QueryParams) => list<LoteOperacional>('/lotes-operacionais', params),
  get: (id: number) => get<LoteOperacional>('/lotes-operacionais', id),
  create: (payload: Record<string, unknown>) => create<LoteOperacional>('/lotes-operacionais', payload),
  update: (id: number, payload: Record<string, unknown>) => update<LoteOperacional>('/lotes-operacionais', id, payload),
  fechar: (id: number, justificativa?: string) => requestJson<LoteOperacional>(`${BASE}/lotes-operacionais/${id}/fechar`, { method: 'POST', body: JSON.stringify({ justificativa }) }),
  reabrir: (id: number, justificativa?: string) => requestJson<LoteOperacional>(`${BASE}/lotes-operacionais/${id}/reabrir`, { method: 'POST', body: JSON.stringify({ justificativa }) }),
  cancelar: (id: number, justificativa?: string) => requestJson<LoteOperacional>(`${BASE}/lotes-operacionais/${id}/cancelar`, { method: 'POST', body: JSON.stringify({ justificativa }) }),
}

export const pesagensApi = {
  list: (params?: QueryParams) => list<Pesagem>('/pesagens', params),
  get: (id: number) => get<Pesagem>('/pesagens', id),
  classificar: (id: number, payload: Record<string, unknown>) => requestJson<Pesagem>(`${BASE}/pesagens/${id}/classificar`, { method: 'POST', body: JSON.stringify(payload) }),
}

export const tabelasDescontoApi = {
  list: (params?: QueryParams) => list<TabelaDesconto>('/tabelas-desconto', params),
  get: (id: number) => get<TabelaDesconto>('/tabelas-desconto', id),
  create: (payload: Record<string, unknown>) => create<TabelaDesconto>('/tabelas-desconto', payload),
  update: (id: number, payload: Record<string, unknown>) => update<TabelaDesconto>('/tabelas-desconto', id, payload),
  addFaixa: (id: number, payload: Record<string, unknown>) => requestJson<FaixaDesconto>(`${BASE}/tabelas-desconto/${id}/faixas`, { method: 'POST', body: JSON.stringify(payload) }),
  updateFaixa: (id: number, payload: Record<string, unknown>) => update<FaixaDesconto>('/faixas-desconto', id, payload),
  removeFaixa: (id: number) => remove('/faixas-desconto', id),
  calcular: (payload: Record<string, unknown>) => requestJson<Record<string, unknown>>(`${BASE}/tabelas-desconto/calcular`, { method: 'POST', body: JSON.stringify(payload) }),
}

export const contratosApi = {
  list: (params?: QueryParams) => list<ContratoSilo>('/contratos', params),
  get: (id: number) => get<ContratoSilo>('/contratos', id),
  create: (payload: Record<string, unknown>) => create<ContratoSilo>('/contratos', payload),
  update: (id: number, payload: Record<string, unknown>) => update<ContratoSilo>('/contratos', id, payload),
  cancelar: (id: number, justificativa: string) => requestJson<ContratoSilo>(`${BASE}/contratos/${id}/cancelar`, { method: 'POST', body: JSON.stringify({ justificativa }) }),
}

export const dadosSaidaApi = {
  list: (params?: QueryParams) => list<DadosSaidaPesagem>('/dados-saida-pesagem', params),
  salvarPorPesagem: (pesagemId: number, payload: Record<string, unknown>) => requestJson<DadosSaidaPesagem>(`${BASE}/pesagens/${pesagemId}/dados-saida`, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Record<string, unknown>) => update<DadosSaidaPesagem>('/dados-saida-pesagem', id, payload),
}

export const relatoriosApi = {
  movimentacoes: (params?: QueryParams) => list<MovimentacaoProduto>('/movimentacoes', params),
  saldosConta: (params?: QueryParams) => list<SaldoContaProduto>('/saldos/contas-produto', params),
  saldosDeposito: (params?: QueryParams) => list<SaldoDeposito>('/saldos/depositos', params),
  entradas: (params?: QueryParams) => list<Pesagem>('/relatorios/entrada', params),
  saidas: (params?: QueryParams) => list<Pesagem>('/relatorios/saida', params),
  lote: (id: number) => requestJson<Record<string, unknown>>(`${BASE}/relatorios/lote-operacional/${id}`),
}
