export const MODULOS = [
  "ADMIN",
  "GERENTE",
  "ESCRITORIO",
  "FOLHA",
  "BALANCA",
  "SILO",
  "BARRACAO",
  "LAVOURA",
  "ALMOXARIFADO",
  "FINANCEIRO",
] as const;

export const MODULOS_NEGOCIO = [
  "ESCRITORIO",
  "FOLHA",
  "BALANCA",
  "SILO",
  "BARRACAO",
  "LAVOURA",
  "ALMOXARIFADO",
  "FINANCEIRO",
] as const;

export const ACOES_PERMISSAO = [
  "visualizar",
  "criar",
  "editar",
  "excluir",
  "restaurar",
] as const;

export type Modulo = (typeof MODULOS)[number];
export type ModuloNegocio = (typeof MODULOS_NEGOCIO)[number];
export type AcaoPermissao = (typeof ACOES_PERMISSAO)[number];

export type CampoPermissao =
  | "pode_visualizar"
  | "pode_criar"
  | "pode_editar"
  | "pode_excluir"
  | "pode_restaurar";

export type PermissaoModulo = {
  id_usuario_modulo?: number;
  usuario_id?: number;
  modulo: Modulo;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_restaurar: boolean;
};

export const ACAO_CAMPO: Record<AcaoPermissao, CampoPermissao> = {
  visualizar: "pode_visualizar",
  criar: "pode_criar",
  editar: "pode_editar",
  excluir: "pode_excluir",
  restaurar: "pode_restaurar",
};

export const isModuloNegocio = (modulo: Modulo): modulo is ModuloNegocio =>
  MODULOS_NEGOCIO.includes(modulo as ModuloNegocio);
