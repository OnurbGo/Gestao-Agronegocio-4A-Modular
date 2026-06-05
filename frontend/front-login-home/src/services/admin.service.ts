import { requestJson, toQuery } from "@/services/api";
import type {
  AccessRequest,
  AdminAccount,
  PageMeta,
  PermissionModule,
  QueryParams,
} from "@/types";

const CORE_BASE = "/api/core";

export function listAccounts(
  params: QueryParams = {},
): Promise<PageMeta<AdminAccount>> {
  return requestJson<PageMeta<AdminAccount>>(
    `${CORE_BASE}/contas${toQuery(params)}`,
  );
}

export function createAccount(data: Partial<AdminAccount>): Promise<AdminAccount> {
  return requestJson<AdminAccount>(`${CORE_BASE}/contas`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAccountStatus(
  contaId: number,
  ativo: boolean,
): Promise<AdminAccount> {
  return requestJson<AdminAccount>(`${CORE_BASE}/contas/${contaId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ ativo }),
  });
}

export function savePermissions(
  contaId: number,
  modulos: PermissionModule[],
): Promise<PermissionModule[]> {
  return requestJson<PermissionModule[]>(`${CORE_BASE}/permissoes/${contaId}`, {
    method: "PUT",
    body: JSON.stringify({ modulos }),
  });
}

export function listAccessRequests(
  params: QueryParams = {},
): Promise<PageMeta<AccessRequest>> {
  return requestJson<PageMeta<AccessRequest>>(
    `${CORE_BASE}/contas/solicitacoes${toQuery(params)}`,
  );
}

export function approveAccessRequest(
  requestId: number,
  modulos: PermissionModule[],
): Promise<AccessRequest> {
  return requestJson<AccessRequest>(
    `${CORE_BASE}/contas/solicitacoes/${requestId}/aprovar`,
    {
      method: "PATCH",
      body: JSON.stringify({ modulos }),
    },
  );
}

export function rejectAccessRequest(
  requestId: number,
  motivo_recusa: string,
): Promise<AccessRequest> {
  return requestJson<AccessRequest>(
    `${CORE_BASE}/contas/solicitacoes/${requestId}/recusar`,
    {
      method: "PATCH",
      body: JSON.stringify({ motivo_recusa }),
    },
  );
}
