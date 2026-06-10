import type { ReactNode } from "react";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export type PaginatedResponse<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PageMeta<TItem = unknown> = PaginatedResponse<TItem>;

export type StatusMessageType = "error" | "success" | "warning" | "info";

export type StatusMessageState = {
  type?: StatusMessageType;
  message?: ReactNode;
} | null;

export type PermissionModule = {
  modulo: string;
  pode_visualizar?: boolean;
  pode_criar?: boolean;
  pode_editar?: boolean;
  pode_excluir?: boolean;
  pode_restaurar?: boolean;
};

export type AuthUser = {
  conta_id?: number;
  usuario_id?: number;
  nome?: string;
  email?: string;
  observacao?: string | null;
  imagem_perfil_url?: string | null;
  possuiAdmin?: boolean;
  possuiGerente?: boolean;
  modulos?: PermissionModule[];
  [key: string]: unknown;
};

export type AuthSession = {
  token: string;
  usuario: AuthUser;
};

export type Credentials = {
  email: string;
  senha: string;
};

export type AccessRequestPayload = Credentials & {
  nome: string;
  modulos_solicitados: string[];
};

export type FirstAccountPayload = Credentials & {
  nome: string;
};

export type AdminAccount = {
  id_conta: number;
  email: string;
  ativo: boolean;
  usuario?: {
    nome?: string;
  };
  modulos?: PermissionModule[];
};

export type AccessRequest = {
  id_solicitacao_conta: number;
  nome: string;
  email: string;
  modulos_solicitados?: unknown;
};

export type DocumentoOrigem = "ENTIDADE" | "IMOVEL";

export type TipoDocumento = {
  id_tipo_documento: number;
  nome: string;
};

export type ArquivoDocumento = {
  id_entidade_arquivo?: number;
  id_imovel_arquivo?: number;
  nome_original: string;
  tipo_mime?: string;
  tamanho?: number;
  createdAt?: string;
  observacao?: string | null;
  tipoDocumento?: {
    nome?: string;
  };
};

export type Entidade = {
  id_entidade: number;
  nome?: string;
  cpf_cnpj?: string;
  rg?: string | null;
  tipo_pessoa?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cidade?: string;
  estado?: string;
  data_nascimento?: string | null;
  data_admissao?: string;
  observacao?: string;
  tipos?: string[];
  participa_folha?: boolean;
};

export type EntidadeFormData = {
  nome: string;
  cpf_cnpj: string;
  rg: string;
  tipo_pessoa: string;
  email: string;
  telefone: string;
  celular: string;
  cidade: string;
  estado: string;
  data_nascimento: string;
  data_admissao: string;
  observacao: string;
  tipos: string[];
};

export type EntidadeReportData = {
  title: string;
  subtitle: string;
  emittedAt: string;
  filters: Array<{ label: string; value: string }>;
  rows: Entidade[];
  totals: Array<{ label: string; value: number | string }>;
};

export type EntidadeResumo = {
  id_entidade: number;
  nome?: string;
  cpf_cnpj?: string;
};

export type Imovel = {
  id_imovel: number;
  nome?: string;
  lote?: string;
  municipio?: string;
  cidade?: string;
  n_lote?: string;
  gleba?: string;
  colonia?: string;
  matricula?: string;
  nirf?: string;
  incra?: string;
  proprietarios?: EntidadeResumo[];
  area_total?: string | number;
  observacao?: string;
};

export type ImovelFormData = {
  nome: string;
  lote: string;
  municipio: string;
  n_lote: string;
  gleba: string;
  colonia: string;
  matricula: string;
  nirf: string;
  incra: string;
  proprietarios_ids: number[];
  area_total: string;
  observacao: string;
};

export type ImoveisReportData = {
  title: string;
  subtitle: string;
  emittedAt: string;
  filters: Array<{ label: string; value: string }>;
  rows: Imovel[];
  totals: Array<{ label: string; value: number | string }>;
};

export type PayrollParticipant = {
  id_entidade: number;
  nome?: string;
  cpf_cnpj?: string;
  data_admissao?: string;
  salario_atual?: string | number | null;
  participa_folha?: boolean;
  [key: string]: unknown;
};

export type PayrollLine = {
  mes: number;
  dias_trabalhados: string;
  salario_bruto: string;
  salario_proporcional: string;
  inss: string;
  irrf: string;
  inss_adicional: string;
  ferias: string;
  ferias_automatica: boolean;
  comissao: string;
  desconto_bar: string;
  desconto_diverso_1: string;
  desconto_diverso_2: string;
  desconto_diverso_3: string;
  salario_liquido: string;
  salario_liquido_com_desconto: string;
  salario_final_com_ferias: string;
};

export type PayrollEditableField =
  | "dias_trabalhados"
  | "inss"
  | "irrf"
  | "inss_adicional"
  | "comissao"
  | "desconto_bar"
  | "desconto_diverso_1"
  | "desconto_diverso_2"
  | "desconto_diverso_3";

export type PayrollLinePayload = {
  mes: number;
  dias_trabalhados: number;
} & Record<Exclude<PayrollEditableField, "dias_trabalhados">, number>;

export type PayrollMonthlyReportItem = {
  id_folha_mensal: number;
  entidade?: {
    nome?: string;
  };
  salario_bruto?: string | number | null;
  salario_proporcional?: string | number | null;
  salario_liquido?: string | number | null;
  salario_liquido_com_desconto?: string | number | null;
  salario_final_com_ferias?: string | number | null;
};

export type PayrollMonthlyReport = {
  nome_mes?: string;
  total?: string | number | null;
  itens?: PayrollMonthlyReportItem[];
};

export type SalaryRecord = {
  id_registro_salarial: number;
  inicio_vigencia?: string | null;
  fim_vigencia?: string | null;
  salario?: string | number | null;
  percentual?: string | number | null;
  observacao?: string | null;
};

export type SalaryForm = {
  inicio_vigencia: string;
  fim_vigencia: string;
  salario: string;
  percentual: string;
  observacao: string;
};

export type SalaryPayload = {
  inicio_vigencia: string;
  fim_vigencia?: string | null;
  salario: number;
  percentual?: number | null;
  observacao?: string | null;
};

export type VacationRecord = {
  id_ferias: number;
  inicio_gozado?: string | null;
  fim_gozado?: string | null;
  dias_gozados?: number;
  valor_ferias?: string | number | null;
  valor_abono?: string | number | null;
  valor_total_ferias?: string | number | null;
};

export type VacationForm = {
  inicio_gozado: string;
  fim_gozado: string;
  valor_abono: string;
};

export type VacationPayload = {
  inicio_gozado: string;
  fim_gozado: string;
  valor_abono?: number;
};

export type VacationSummary = {
  referencia_inicio: string | null;
  periodo_aquisitivo_inicio: string | null;
  periodo_aquisitivo_fim: string | null;
  anos_aquisitivos: number;
  dias_adquiridos: number;
  total_dias_gozados: number;
  saldo_ferias_dias: number;
};

export type VacationListPayload = PaginatedResponse<VacationRecord> & {
  summary?: VacationSummary;
};

export type SalaryImpactVacation = Partial<VacationRecord> & {
  descricao?: string;
};

export type SalaryImpactPayroll = {
  ano: number;
  mes: number;
  descricao?: string;
};

export type SalaryImpactMissing = {
  tipo: string;
  referencia?: string;
  descricao?: string;
};

export type SalaryImpact = {
  tem_impacto?: boolean;
  ferias?: SalaryImpactVacation[];
  lancamentos?: SalaryImpactPayroll[];
  sem_salario?: SalaryImpactMissing[];
};

export type PendingSalaryImpact =
  | {
      acao: "editar";
      titulo: string;
      mensagem: string;
      impacto: SalaryImpact;
      payload: SalaryPayload;
      registroId: number;
    }
  | {
      acao: "excluir";
      titulo: string;
      mensagem: string;
      impacto: SalaryImpact;
      registro: SalaryRecord;
    };

export type SuggestedPercentage = {
  percentual_sugerido?: string | number | null;
  salario_base?: string | number | null;
};

export type BaseEntity = Record<string, unknown>;

export type EntidadeReferencia = {
  id_entidade: number;
  nome?: string;
  cpf_cnpj?: string | null;
  documento?: string | null;
  tipo_pessoa?: string | null;
  telefone?: string | null;
  celular?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

export type ImovelReferencia = {
  id_imovel: number;
  nome?: string;
  lote?: string | null;
  n_lote?: string | null;
  municipio?: string | null;
  cidade?: string | null;
  colonia?: string | null;
  matricula?: string | null;
};

export type AreaLoteReferencia = {
  id_area_lote?: number;
  nome?: string;
};

export type SafraReferencia = {
  id_safra?: number;
  nome?: string;
};

export type ContaProduto = BaseEntity & {
  id_conta_produto: number;
  entidade_id_ref?: number | null;
  nome?: string;
  documento?: string | null;
  ativa?: boolean;
  observacao?: string | null;
};

export type ItemSilo = BaseEntity & {
  id_item: number;
  nome?: string;
  unidade_medida?: string;
  controla_estoque?: boolean;
  exige_classificacao?: boolean;
  ativo?: boolean;
};

export type CadastroAuxiliar = BaseEntity & {
  entidade_id_ref?: number | null;
  nome?: string;
  documento?: string | null;
  telefone?: string | null;
  observacao?: string | null;
  descricao?: string | null;
  ativo?: boolean;
  ativa?: boolean;
};

export type Transportadora = CadastroAuxiliar & {
  id_transportadora: number;
};

export type Emissor = CadastroAuxiliar & {
  id_emissor: number;
};

export type Deposito = CadastroAuxiliar & {
  id_deposito: number;
};

export type Destino = CadastroAuxiliar & {
  id_destino: number;
};

export type ContratoSilo = BaseEntity & {
  id_contrato: number;
  numero_contrato?: string;
  conta_produto_id?: number;
  item_id?: number;
  comprador_entidade_id_ref?: number | null;
  comprador_nome_cache?: string | null;
  quantidade_contratada_kg?: string | number;
  quantidade_entregue_kg?: string | number;
  saldo_kg?: string | number;
  status?: string;
  data_contrato?: string | null;
  observacao?: string | null;
  conta_produto?: ContaProduto;
  item?: ItemSilo;
};

export type LoteOperacional = BaseEntity & {
  id_lote_operacional: number;
  nome?: string;
  tipo?: string;
  status?: string;
  conta_produto_id?: number;
  item_id?: number;
  contrato_id?: number | null;
  imovel_id_ref?: number | null;
  area_lote_id_ref?: number | null;
  safra_id_ref?: number | null;
  destino_id?: number | null;
  observacao?: string | null;
  conta_produto?: ContaProduto;
  item?: ItemSilo;
  destino?: Destino;
  contrato?: ContratoSilo;
  pesagens?: Pesagem[];
};

export type ClassificacaoPesagem = BaseEntity & {
  id_classificacao_pesagem?: number;
  tabela_desconto_id?: number;
  umidade_percentual?: string | number;
  impureza_percentual?: string | number;
  desconto_umidade_percentual?: string | number;
  desconto_impureza_percentual?: string | number;
  desconto_umidade_kg?: string | number;
  desconto_impureza_kg?: string | number;
  peso_final_kg?: string | number;
  sacas_final?: string | number;
};

export type Pesagem = BaseEntity & {
  id_pesagem: number;
  lote_operacional_id?: number;
  serie_romaneio_id?: number;
  numero_romaneio?: number;
  tipo_operacao?: string;
  status?: string;
  placa?: string;
  motorista_nome?: string;
  peso_liquido_kg?: string | number | null;
  pesagem_1_kg?: string | number | null;
  pesagem_2_kg?: string | number | null;
  data_pesagem_1?: string | null;
  data_pesagem_2?: string | null;
  finalizada_em?: string | null;
  conta_produto?: ContaProduto;
  item?: ItemSilo;
  transportadora?: Transportadora;
  emissor?: Emissor;
  deposito?: Deposito;
  destino?: Destino;
  contrato?: ContratoSilo;
  lote_operacional?: LoteOperacional;
  serie_romaneio?: {
    numero_serie?: string;
  };
  classificacao?: ClassificacaoPesagem;
};

export type TabelaDesconto = BaseEntity & {
  id_tabela_desconto: number;
  item_id?: number;
  nome?: string;
  ativa?: boolean;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
  item?: ItemSilo;
  faixas?: FaixaDesconto[];
};

export type FaixaDesconto = BaseEntity & {
  id_faixa_desconto: number;
  tabela_desconto_id?: number;
  tipo?: string;
  valor_inicial?: string | number;
  valor_final?: string | number;
  percentual_desconto?: string | number;
  ativa?: boolean;
};

export type DadosSaidaPesagem = BaseEntity & {
  id_dados_saida_pesagem: number;
  pesagem_id?: number;
  lote_operacional_id?: number;
  numero_nota_fiscal?: string | null;
  peso_nf_kg?: string | number | null;
  peso_nf_sacas?: string | number | null;
  valor_total?: string | number | null;
  senar_valor?: string | number | null;
  funrural_valor?: string | number | null;
  icms_valor?: string | number | null;
  frete_valor?: string | number | null;
  corretagem_valor?: string | number | null;
  royalties_valor?: string | number | null;
  cad_pro?: string | null;
  imovel_emissor_id_ref?: number | null;
  observacao?: string | null;
  pesagem?: Pesagem;
  lote_operacional?: LoteOperacional;
};

export type SaldoContaProduto = BaseEntity & {
  id_saldo_conta_produto: number;
  saldo_kg?: string | number;
  saldo_sacas?: string | number;
  conta_produto?: ContaProduto;
  item?: ItemSilo;
};

export type SaldoDeposito = BaseEntity & {
  id_saldo_deposito: number;
  saldo_kg?: string | number;
  saldo_sacas?: string | number;
  deposito?: Deposito;
  item?: ItemSilo;
};

export type MovimentacaoProduto = BaseEntity & {
  id_movimentacao_produto: number;
  tipo_movimentacao?: string;
  quantidade_kg?: string | number;
  quantidade_sacas?: string | number;
  data_movimentacao?: string;
  conta_produto?: ContaProduto;
  item?: ItemSilo;
  deposito?: Deposito;
  lote_operacional?: LoteOperacional;
};
