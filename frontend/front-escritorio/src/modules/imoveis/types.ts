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

export type PageMeta = {
  total: number;
  page: number;
  totalPages: number;
};

