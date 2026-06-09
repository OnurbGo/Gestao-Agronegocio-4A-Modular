export const LOTE_OPERACIONAL_TIPOS = [
  "ENTRADA",
  "SAIDA",
  "EMBARQUE",
  "RETIRADA",
  "TRANSFERENCIA",
  "AJUSTE",
] as const;

export const LOTE_OPERACIONAL_STATUS = [
  "ABERTO",
  "EM_ANDAMENTO",
  "FECHADO",
  "CANCELADO",
] as const;

export const PESAGEM_TIPOS_OPERACAO = ["ENTRADA", "SAIDA"] as const;

export const PESAGEM_STATUS = [
  "ABERTA",
  "PESAGEM_1_REALIZADA",
  "PESAGEM_2_REALIZADA",
  "CLASSIFICADA",
  "FINALIZADA",
  "CANCELADA",
] as const;

export const PESAGEM_ORIGENS = [
  "WEB",
  "DESKTOP_ONLINE",
  "DESKTOP_OFFLINE",
] as const;

export const ROMANEIO_RANGE_STATUS = [
  "ATIVA",
  "ESGOTADA",
  "EXPIRADA",
  "CANCELADA",
] as const;

export const TIPOS_DESCONTO = ["UMIDADE", "IMPUREZA"] as const;

export const CONTRATO_STATUS = [
  "ABERTO",
  "PARCIAL",
  "CONCLUIDO",
  "CANCELADO",
] as const;

export const TIPOS_MOVIMENTACAO = ["ENTRADA", "SAIDA"] as const;

export type LoteOperacionalTipo = (typeof LOTE_OPERACIONAL_TIPOS)[number];
export type LoteOperacionalStatus = (typeof LOTE_OPERACIONAL_STATUS)[number];
export type PesagemTipoOperacao = (typeof PESAGEM_TIPOS_OPERACAO)[number];
export type PesagemStatus = (typeof PESAGEM_STATUS)[number];
export type PesagemOrigem = (typeof PESAGEM_ORIGENS)[number];
export type RomaneioRangeStatus = (typeof ROMANEIO_RANGE_STATUS)[number];
export type TipoDesconto = (typeof TIPOS_DESCONTO)[number];
export type ContratoStatus = (typeof CONTRATO_STATUS)[number];
export type TipoMovimentacao = (typeof TIPOS_MOVIMENTACAO)[number];
