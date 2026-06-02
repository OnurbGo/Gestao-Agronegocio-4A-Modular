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

export const ACOES_PERMISSAO = [
  "visualizar",
  "criar",
  "editar",
  "excluir",
  "restaurar",
] as const;

export type Modulo = (typeof MODULOS)[number];
export type AcaoPermissao = (typeof ACOES_PERMISSAO)[number];

export type PermissaoModulo = {
  id_conta_modulo?: number;
  conta_id?: number;
  modulo: Modulo;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
  pode_restaurar: boolean;
};

export const ACAO_CAMPO: Record<AcaoPermissao, keyof PermissaoModulo> = {
  visualizar: "pode_visualizar",
  criar: "pode_criar",
  editar: "pode_editar",
  excluir: "pode_excluir",
  restaurar: "pode_restaurar",
};

