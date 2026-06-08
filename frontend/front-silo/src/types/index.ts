import type { ReactNode } from 'react'

export type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

export type PaginatedResponse<TItem> = {
  items: TItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type StatusMessageType = 'error' | 'success' | 'warning' | 'info'

export type StatusMessageState = {
  type?: StatusMessageType
  message?: ReactNode
} | null

export type PermissionModule = {
  modulo: string
  pode_visualizar?: boolean
  pode_criar?: boolean
  pode_editar?: boolean
  pode_excluir?: boolean
  pode_restaurar?: boolean
}

export type AuthUser = {
  conta_id?: number
  usuario_id?: number
  nome?: string
  email?: string
  possuiAdmin?: boolean
  possuiGerente?: boolean
  modulos?: PermissionModule[]
  [key: string]: unknown
}

export type BaseEntity = Record<string, unknown>

export type EntidadeReferencia = {
  id_entidade: number
  nome?: string
  cpf_cnpj?: string | null
  documento?: string | null
  tipo_pessoa?: string | null
  telefone?: string | null
  celular?: string | null
  cidade?: string | null
  estado?: string | null
}

export type ImovelReferencia = {
  id_imovel: number
  nome?: string
  lote?: string | null
  n_lote?: string | null
  municipio?: string | null
  cidade?: string | null
  colonia?: string | null
  matricula?: string | null
}

export type AreaLoteReferencia = {
  id_area_lote?: number
  nome?: string
}

export type SafraReferencia = {
  id_safra?: number
  nome?: string
}

export type ContaProduto = BaseEntity & {
  id_conta_produto: number
  entidade_id_ref?: number | null
  nome?: string
  documento?: string | null
  ativa?: boolean
  observacao?: string | null
}

export type ItemSilo = BaseEntity & {
  id_item: number
  nome?: string
  unidade_medida?: string
  controla_estoque?: boolean
  exige_classificacao?: boolean
  ativo?: boolean
}

export type CadastroAuxiliar = BaseEntity & {
  entidade_id_ref?: number | null
  nome?: string
  documento?: string | null
  telefone?: string | null
  observacao?: string | null
  descricao?: string | null
  ativo?: boolean
  ativa?: boolean
}

export type Transportadora = CadastroAuxiliar & {
  id_transportadora: number
}

export type Emissor = CadastroAuxiliar & {
  id_emissor: number
}

export type Deposito = CadastroAuxiliar & {
  id_deposito: number
}

export type Destino = CadastroAuxiliar & {
  id_destino: number
}

export type LoteOperacional = BaseEntity & {
  id_lote_operacional: number
  nome?: string
  tipo?: string
  status?: string
  conta_produto_id?: number
  item_id?: number
  contrato_id?: number | null
  imovel_id_ref?: number | null
  area_lote_id_ref?: number | null
  safra_id_ref?: number | null
  destino_id?: number | null
  observacao?: string | null
  conta_produto?: ContaProduto
  item?: ItemSilo
  destino?: Destino
  contrato?: ContratoSilo
  pesagens?: Pesagem[]
}

export type ClassificacaoPesagem = BaseEntity & {
  id_classificacao_pesagem?: number
  tabela_desconto_id?: number
  umidade_percentual?: string | number
  impureza_percentual?: string | number
  desconto_umidade_percentual?: string | number
  desconto_impureza_percentual?: string | number
  desconto_umidade_kg?: string | number
  desconto_impureza_kg?: string | number
  peso_final_kg?: string | number
  sacas_final?: string | number
}

export type Pesagem = BaseEntity & {
  id_pesagem: number
  lote_operacional_id?: number
  serie_romaneio_id?: number
  numero_romaneio?: number
  tipo_operacao?: string
  status?: string
  placa?: string
  motorista_nome?: string
  peso_liquido_kg?: string | number | null
  pesagem_1_kg?: string | number | null
  pesagem_2_kg?: string | number | null
  data_pesagem_1?: string | null
  data_pesagem_2?: string | null
  finalizada_em?: string | null
  conta_produto?: ContaProduto
  item?: ItemSilo
  transportadora?: Transportadora
  emissor?: Emissor
  deposito?: Deposito
  destino?: Destino
  contrato?: ContratoSilo
  lote_operacional?: LoteOperacional
  serie_romaneio?: {
    numero_serie?: string
  }
  classificacao?: ClassificacaoPesagem
}

export type TabelaDesconto = BaseEntity & {
  id_tabela_desconto: number
  item_id?: number
  nome?: string
  ativa?: boolean
  vigencia_inicio?: string | null
  vigencia_fim?: string | null
  item?: ItemSilo
  faixas?: FaixaDesconto[]
}

export type FaixaDesconto = BaseEntity & {
  id_faixa_desconto: number
  tabela_desconto_id?: number
  tipo?: string
  valor_inicial?: string | number
  valor_final?: string | number
  percentual_desconto?: string | number
  ativa?: boolean
}

export type ContratoSilo = BaseEntity & {
  id_contrato: number
  numero_contrato?: string
  conta_produto_id?: number
  item_id?: number
  comprador_entidade_id_ref?: number | null
  comprador_nome_cache?: string | null
  quantidade_contratada_kg?: string | number
  quantidade_entregue_kg?: string | number
  saldo_kg?: string | number
  status?: string
  data_contrato?: string | null
  observacao?: string | null
  conta_produto?: ContaProduto
  item?: ItemSilo
}

export type DadosSaidaPesagem = BaseEntity & {
  id_dados_saida_pesagem: number
  pesagem_id?: number
  lote_operacional_id?: number
  numero_nota_fiscal?: string | null
  peso_nf_kg?: string | number | null
  peso_nf_sacas?: string | number | null
  valor_total?: string | number | null
  senar_valor?: string | number | null
  funrural_valor?: string | number | null
  icms_valor?: string | number | null
  frete_valor?: string | number | null
  corretagem_valor?: string | number | null
  royalties_valor?: string | number | null
  cad_pro?: string | null
  imovel_emissor_id_ref?: number | null
  observacao?: string | null
  pesagem?: Pesagem
  lote_operacional?: LoteOperacional
}

export type SaldoContaProduto = BaseEntity & {
  id_saldo_conta_produto: number
  saldo_kg?: string | number
  saldo_sacas?: string | number
  conta_produto?: ContaProduto
  item?: ItemSilo
}

export type SaldoDeposito = BaseEntity & {
  id_saldo_deposito: number
  saldo_kg?: string | number
  saldo_sacas?: string | number
  deposito?: Deposito
  item?: ItemSilo
}

export type MovimentacaoProduto = BaseEntity & {
  id_movimentacao_produto: number
  tipo_movimentacao?: string
  quantidade_kg?: string | number
  quantidade_sacas?: string | number
  data_movimentacao?: string
  conta_produto?: ContaProduto
  item?: ItemSilo
  deposito?: Deposito
  lote_operacional?: LoteOperacional
}
