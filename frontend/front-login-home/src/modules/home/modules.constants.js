export const SYSTEM_MODULES = [
  {
    id: 'ESCRITORIO',
    nome: 'Escritório',
    descricao: 'Entidades, documentos e folha de pagamento.',
    status: 'Disponível',
    url: import.meta.env.VITE_ESCRITORIO_URL || 'http://localhost:5174',
  },
  {
    id: 'BALANCA',
    nome: 'Balança',
    descricao: 'Pesagens, entradas e saídas.',
    status: 'Em planejamento',
  },
  {
    id: 'SILO',
    nome: 'Silo',
    descricao: 'Armazenagem, lotes e movimentações.',
    status: 'Em planejamento',
  },
  {
    id: 'BARRACAO',
    nome: 'Barracão',
    descricao: 'Operações, máquinas e apoio de campo.',
    status: 'Em planejamento',
  },
  {
    id: 'LAVOURA',
    nome: 'Lavoura',
    descricao: 'Talhões, safras e acompanhamentos.',
    status: 'Em planejamento',
  },
  {
    id: 'ALMOXARIFADO',
    nome: 'Almoxarifado',
    descricao: 'Estoque, requisições e compras.',
    status: 'Em planejamento',
  },
]

export const ADMIN_MODULES = [
  'ADMIN',
  'GERENTE',
  ...SYSTEM_MODULES.map((module) => module.id),
  'FOLHA',
  'FINANCEIRO',
]

export const PERMISSION_ACTIONS = [
  { key: 'pode_visualizar', label: 'Ver' },
  { key: 'pode_criar', label: 'Criar' },
  { key: 'pode_editar', label: 'Editar' },
  { key: 'pode_excluir', label: 'Excluir' },
  { key: 'pode_restaurar', label: 'Restaurar' },
]

const MODULE_DEPENDENCIES = {
  ESCRITORIO: ['FOLHA'],
}

function expandPermissionModules(selectedModules = []) {
  return [
    ...new Set(
      selectedModules.flatMap((moduleId) => [
        moduleId,
        ...(MODULE_DEPENDENCIES[moduleId] || []),
      ]),
    ),
  ]
}

export function buildDefaultPermissions(selectedModules = []) {
  return expandPermissionModules(selectedModules).map((modulo) => ({
    modulo,
    pode_visualizar: true,
    pode_criar: false,
    pode_editar: false,
    pode_excluir: false,
    pode_restaurar: false,
  }))
}

export function hasModuleAccess(usuario, moduleId) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) => permissao.modulo === moduleId && permissao.pode_visualizar,
    ),
  )
}
