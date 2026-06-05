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

export type PageMeta = {
  total: number
  page: number
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
}

export type AuthUser = {
  usuario_id?: number
  nome?: string
  email?: string
  possuiAdmin?: boolean
  possuiGerente?: boolean
  modulos?: PermissionModule[]
  [key: string]: unknown
}

export type DocumentoOrigem = 'ENTIDADE' | 'IMOVEL'

export type TipoDocumento = {
  id_tipo_documento: number
  nome: string
}

export type ArquivoDocumento = {
  id_entidade_arquivo?: number
  id_imovel_arquivo?: number
  nome_original: string
  tipo_mime?: string
  tamanho?: number
  createdAt?: string
  observacao?: string | null
  tipoDocumento?: {
    nome?: string
  }
}

export type Entidade = {
  id_entidade: number
  nome?: string
  cpf_cnpj?: string
  tipo_pessoa?: string
  email?: string
  telefone?: string
  celular?: string
  cidade?: string
  estado?: string
  data_admissao?: string
  observacao?: string
  tipos?: string[]
  participa_folha?: boolean
}

export type EntidadeFormData = {
  nome: string
  cpf_cnpj: string
  tipo_pessoa: string
  email: string
  telefone: string
  celular: string
  cidade: string
  estado: string
  data_admissao: string
  observacao: string
  tipos: string[]
}

export type EntidadeReportData = {
  title: string
  subtitle: string
  emittedAt: string
  filters: Array<{ label: string; value: string }>
  rows: Entidade[]
  totals: Array<{ label: string; value: number | string }>
}

export type EntidadeResumo = {
  id_entidade: number
  nome?: string
  cpf_cnpj?: string
}

export type Imovel = {
  id_imovel: number
  nome?: string
  lote?: string
  municipio?: string
  cidade?: string
  n_lote?: string
  gleba?: string
  colonia?: string
  matricula?: string
  nirf?: string
  incra?: string
  proprietarios?: EntidadeResumo[]
  area_total?: string | number
  observacao?: string
}

export type ImovelFormData = {
  nome: string
  lote: string
  municipio: string
  n_lote: string
  gleba: string
  colonia: string
  matricula: string
  nirf: string
  incra: string
  proprietarios_ids: number[]
  area_total: string
  observacao: string
}

export type ImoveisReportData = {
  title: string
  subtitle: string
  emittedAt: string
  filters: Array<{ label: string; value: string }>
  rows: Imovel[]
  totals: Array<{ label: string; value: number | string }>
}

export type PayrollParticipant = {
  id_entidade: number
  nome?: string
  cpf_cnpj?: string
  data_admissao?: string
  salario_atual?: string | number | null
  participa_folha?: boolean
  [key: string]: unknown
}

export type PayrollLine = {
  mes: number
  dias_trabalhados: string
  salario_bruto: string
  salario_proporcional: string
  inss: string
  irrf: string
  inss_adicional: string
  ferias: string
  ferias_automatica: boolean
  comissao: string
  desconto_bar: string
  desconto_diverso_1: string
  desconto_diverso_2: string
  desconto_diverso_3: string
  salario_liquido: string
  salario_liquido_com_desconto: string
  salario_final_com_ferias: string
}

export type PayrollEditableField =
  | 'dias_trabalhados'
  | 'inss'
  | 'irrf'
  | 'inss_adicional'
  | 'comissao'
  | 'desconto_bar'
  | 'desconto_diverso_1'
  | 'desconto_diverso_2'
  | 'desconto_diverso_3'

export type PayrollLinePayload = {
  mes: number
  dias_trabalhados: number
} & Record<Exclude<PayrollEditableField, 'dias_trabalhados'>, number>

export type PayrollMonthlyReportItem = {
  id_folha_mensal: number
  entidade?: {
    nome?: string
  }
  salario_bruto?: string | number | null
  salario_proporcional?: string | number | null
  salario_liquido?: string | number | null
  salario_liquido_com_desconto?: string | number | null
  salario_final_com_ferias?: string | number | null
}

export type PayrollMonthlyReport = {
  nome_mes?: string
  total?: string | number | null
  itens?: PayrollMonthlyReportItem[]
}

export type SalaryRecord = {
  id_registro_salarial: number
  inicio_vigencia?: string | null
  fim_vigencia?: string | null
  salario?: string | number | null
  percentual?: string | number | null
  observacao?: string | null
}

export type SalaryForm = {
  inicio_vigencia: string
  fim_vigencia: string
  salario: string
  percentual: string
  observacao: string
}

export type SalaryPayload = {
  inicio_vigencia: string
  fim_vigencia?: string | null
  salario: number
  percentual?: number | null
  observacao?: string | null
}

export type VacationRecord = {
  id_ferias: number
  inicio_gozado?: string | null
  fim_gozado?: string | null
  dias_gozados?: number
  valor_ferias?: string | number | null
  valor_abono?: string | number | null
  valor_total_ferias?: string | number | null
}

export type VacationForm = {
  inicio_gozado: string
  fim_gozado: string
  valor_abono: string
}

export type VacationPayload = {
  inicio_gozado: string
  fim_gozado: string
  valor_abono?: number
}

export type VacationSummary = {
  referencia_inicio: string | null
  periodo_aquisitivo_inicio: string | null
  periodo_aquisitivo_fim: string | null
  anos_aquisitivos: number
  dias_adquiridos: number
  total_dias_gozados: number
  saldo_ferias_dias: number
}

export type VacationListPayload = PaginatedResponse<VacationRecord> & {
  summary?: VacationSummary
}

export type SalaryImpactVacation = Partial<VacationRecord> & {
  descricao?: string
}

export type SalaryImpactPayroll = {
  ano: number
  mes: number
  descricao?: string
}

export type SalaryImpactMissing = {
  tipo: string
  referencia?: string
  descricao?: string
}

export type SalaryImpact = {
  tem_impacto?: boolean
  ferias?: SalaryImpactVacation[]
  lancamentos?: SalaryImpactPayroll[]
  sem_salario?: SalaryImpactMissing[]
}

export type PendingSalaryImpact =
  | {
      acao: 'editar'
      titulo: string
      mensagem: string
      impacto: SalaryImpact
      payload: SalaryPayload
      registroId: number
    }
  | {
      acao: 'excluir'
      titulo: string
      mensagem: string
      impacto: SalaryImpact
      registro: SalaryRecord
    }

export type SuggestedPercentage = {
  percentual_sugerido?: string | number | null
  salario_base?: string | number | null
}
