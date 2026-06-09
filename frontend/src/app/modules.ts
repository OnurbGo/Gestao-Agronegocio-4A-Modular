import type { AuthUser } from "@/shared/types";

export const SYSTEM_MODULES = [
  {
    id: "ESCRITORIO",
    nome: "Escritorio",
    descricao: "Pessoas/empresas e cadastros base.",
    status: "Disponivel",
    url: "/escritorio",
  },
  {
    id: "BALANCA",
    nome: "Balanca",
    descricao: "Pesagens, entradas e saidas.",
    status: "Em planejamento",
  },
  {
    id: "SILO",
    nome: "Silo",
    descricao: "Armazenagem, lotes e movimentacoes.",
    status: "Disponivel",
    url: "/silo",
  },
  {
    id: "BARRACAO",
    nome: "Barracao",
    descricao: "Operacoes, maquinas e apoio de campo.",
    status: "Em planejamento",
  },
  {
    id: "LAVOURA",
    nome: "Lavoura",
    descricao: "Talhoes, safras e acompanhamentos.",
    status: "Em planejamento",
  },
  {
    id: "ALMOXARIFADO",
    nome: "Almoxarifado",
    descricao: "Estoque, requisicoes e compras.",
    status: "Em planejamento",
  },
];

export const ADMIN_MODULES = [
  "ADMIN",
  "GERENTE",
  ...SYSTEM_MODULES.map((module) => module.id),
  "CLASSIFICACAO",
  "LANCAMENTOS_SILO",
  "FOLHA",
  "FINANCEIRO",
];

export const MODULE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
  CLASSIFICACAO: "Classificacao",
  LANCAMENTOS_SILO: "Lancamentos Silo",
  FOLHA: "Folha de Pagamento",
  FINANCEIRO: "Financeiro",
  ...Object.fromEntries(
    SYSTEM_MODULES.map((module) => [module.id, module.nome]),
  ),
};

export const PERMISSION_ACTIONS = [
  { key: "pode_visualizar", label: "Ver" },
  { key: "pode_criar", label: "Criar" },
  { key: "pode_editar", label: "Editar" },
  { key: "pode_excluir", label: "Excluir" },
  { key: "pode_restaurar", label: "Restaurar" },
];

export function buildDefaultPermissions(selectedModules: string[] = []) {
  return [...new Set(selectedModules)].map((modulo) => ({
    modulo,
    pode_visualizar: true,
    pode_criar: true,
    pode_editar: true,
    pode_excluir: true,
    pode_restaurar: true,
  }));
}

export function getModuleLabel(moduleId: string) {
  return MODULE_LABELS[moduleId] || moduleId;
}

export function hasModuleAccess(usuario: AuthUser | null | undefined, moduleId: string) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true;
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) => permissao.modulo === moduleId && permissao.pode_visualizar,
    ),
  );
}
