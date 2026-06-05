import { resolveEscritorioUrl } from "@/utils/frontend-url";

export const SYSTEM_MODULES = [
  {
    id: "ESCRITORIO",
    nome: "Escritório",
    descricao: "Pessoas/empresas e cadastros base.",
    status: "Disponível",
    url: resolveEscritorioUrl(import.meta.env.VITE_ESCRITORIO_URL),
  },
  {
    id: "BALANCA",
    nome: "Balança",
    descricao: "Pesagens, entradas e saídas.",
    status: "Em planejamento",
  },
  {
    id: "SILO",
    nome: "Silo",
    descricao: "Armazenagem, lotes e movimentações.",
    status: "Em planejamento",
  },
  {
    id: "BARRACAO",
    nome: "Barracão",
    descricao: "Operações, máquinas e apoio de campo.",
    status: "Em planejamento",
  },
  {
    id: "LAVOURA",
    nome: "Lavoura",
    descricao: "Talhões, safras e acompanhamentos.",
    status: "Em planejamento",
  },
  {
    id: "ALMOXARIFADO",
    nome: "Almoxarifado",
    descricao: "Estoque, requisições e compras.",
    status: "Em planejamento",
  },
];

export const ADMIN_MODULES = [
  "ADMIN",
  "GERENTE",
  ...SYSTEM_MODULES.map((module) => module.id),
  "FOLHA",
  "FINANCEIRO",
];

export const MODULE_LABELS = {
  ADMIN: "Admin",
  GERENTE: "Gerente",
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

export function buildDefaultPermissions(selectedModules = []) {
  return [...new Set(selectedModules)].map((modulo) => ({
    modulo,
    pode_visualizar: true,
    pode_criar: true,
    pode_editar: true,
    pode_excluir: true,
    pode_restaurar: true,
  }));
}

export function getModuleLabel(moduleId) {
  return MODULE_LABELS[moduleId] || moduleId;
}

export function hasModuleAccess(usuario, moduleId) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true;
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) => permissao.modulo === moduleId && permissao.pode_visualizar,
    ),
  );
}
