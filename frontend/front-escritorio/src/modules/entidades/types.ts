export type Entidade = {
  id_entidade: number;
  nome?: string;
  cpf_cnpj?: string;
  tipo_pessoa?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cidade?: string;
  estado?: string;
  data_admissao?: string;
  observacao?: string;
  tipos?: string[];
};

export type EntidadeFormData = {
  nome: string;
  cpf_cnpj: string;
  tipo_pessoa: string;
  email: string;
  telefone: string;
  celular: string;
  cidade: string;
  estado: string;
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

export type PageMeta = {
  total: number;
  page: number;
  totalPages: number;
};

