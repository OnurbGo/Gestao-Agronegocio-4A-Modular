import type { AuthContext } from "../../src/modules/auth/types/auth.types";
import type { PermissaoModulo } from "../../src/modules/permissoes/types/modulo.enum";

export function authHeader(token = "admin-token") {
  return { Authorization: `Bearer ${token}` };
}

export function makePermission(
  overrides: Partial<PermissaoModulo> = {},
): PermissaoModulo {
  return {
    modulo: "ESCRITORIO",
    pode_visualizar: true,
    pode_criar: true,
    pode_editar: true,
    pode_excluir: true,
    pode_restaurar: true,
    ...overrides,
  };
}

export function makeAuthContext(
  overrides: Partial<AuthContext> = {},
): AuthContext {
  const modulos = overrides.modulos || [
    makePermission({ modulo: "ADMIN" }),
    makePermission({ modulo: "ESCRITORIO" }),
    makePermission({ modulo: "FOLHA" }),
  ];

  return {
    conta_id: 1,
    usuario_id: 1,
    nome: "Administrador",
    imagem_perfil_url: null,
    observacao: null,
    email: "admin@teste.local",
    modulos,
    possuiAdmin: modulos.some(
      (modulo) => modulo.modulo === "ADMIN" && modulo.pode_visualizar,
    ),
    possuiGerente: modulos.some(
      (modulo) => modulo.modulo === "GERENTE" && modulo.pode_visualizar,
    ),
    ...overrides,
  };
}
