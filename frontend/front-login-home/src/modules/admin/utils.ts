import type {
  AdminAccount,
  AdminModuleId,
  PageMeta,
  PermissionModule,
} from "./types";

export function formatRequestedModules(value: unknown): AdminModuleId[] {
  if (!value) {
    return ["ESCRITORIO"];
  }

  if (Array.isArray(value)) {
    return value.length ? value : ["ESCRITORIO"];
  }

  if (typeof value === "object") {
    const modules = Object.values(value).filter(Boolean);
    return modules.length ? (modules as AdminModuleId[]) : ["ESCRITORIO"];
  }

  return ["ESCRITORIO"];
}

export function getRequestedModules(value: unknown): AdminModuleId[] {
  return formatRequestedModules(value);
}

export function moduleHasPermission(permissao?: PermissionModule): boolean {
  return Boolean(
    permissao?.pode_visualizar ||
      permissao?.pode_criar ||
      permissao?.pode_editar ||
      permissao?.pode_excluir ||
      permissao?.pode_restaurar,
  );
}

export function getActiveModules(modulos: PermissionModule[] = []): AdminModuleId[] {
  return modulos.filter(moduleHasPermission).map((permissao) => permissao.modulo);
}

export function hasActiveModule(
  modulos: PermissionModule[] = [],
  moduleId: AdminModuleId,
): boolean {
  return getActiveModules(modulos).includes(moduleId);
}

export function filterModulesForActor(
  modulos: AdminModuleId[],
  usuario?: { possuiGerente?: boolean; possuiAdmin?: boolean },
): AdminModuleId[] {
  if (usuario?.possuiGerente && !usuario?.possuiAdmin) {
    return modulos.filter(
      (moduleId) => !["ADMIN", "GERENTE"].includes(moduleId),
    );
  }

  return modulos;
}

export function isProtectedAccount(account?: AdminAccount): boolean {
  return (
    hasActiveModule(account?.modulos, "ADMIN") ||
    hasActiveModule(account?.modulos, "GERENTE")
  );
}

export function normalizePage<TItem>(
  payload: TItem[] | Partial<PageMeta<TItem>> | null | undefined,
  fallbackLimit = 10,
): PageMeta<TItem> {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: fallbackLimit,
      totalPages: 1,
    };
  }

  return {
    items: payload?.items || [],
    total: payload?.total || 0,
    page: payload?.page || 1,
    limit: payload?.limit || fallbackLimit,
    totalPages: payload?.totalPages || 1,
  };
}

