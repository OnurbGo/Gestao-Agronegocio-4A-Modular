import type { PermissaoModulo } from "../../src/modules/permissoes/types/modulo.enum";

export function makeModuloModel(overrides: Partial<PermissaoModulo> = {}) {
  const plain: PermissaoModulo = {
    modulo: "ADMIN",
    pode_visualizar: true,
    pode_criar: true,
    pode_editar: true,
    pode_excluir: true,
    pode_restaurar: true,
    ...overrides,
  };

  return {
    ...plain,
    get: () => plain,
  };
}

export function makeContaModel(overrides: Record<string, unknown> = {}) {
  return {
    id_conta: 1,
    usuario_id: 1,
    email: "admin@teste.local",
    senha_hash: "$2b$10$hash",
    ativo: true,
    senha_alterada_em: null,
    usuario: {
      nome: "Administrador",
      imagem_perfil_url: null,
      observacao: null,
    },
    modulos: [makeModuloModel({ modulo: "ADMIN" })],
    ...overrides,
  };
}
