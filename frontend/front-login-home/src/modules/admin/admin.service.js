import { requestJson, toQuery } from "../../shared/services/api";

const CORE_BASE = "/api/core";

export function listAccounts(params = {}) {
  return requestJson(`${CORE_BASE}/contas${toQuery(params)}`);
}

export function createAccount(data) {
  return requestJson(`${CORE_BASE}/contas`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAccountStatus(contaId, ativo) {
  return requestJson(`${CORE_BASE}/contas/${contaId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ ativo }),
  });
}

export function savePermissions(contaId, modulos) {
  return requestJson(`${CORE_BASE}/permissoes/${contaId}`, {
    method: "PUT",
    body: JSON.stringify({ modulos }),
  });
}

export function listAccessRequests(params = {}) {
  return requestJson(`${CORE_BASE}/contas/solicitacoes${toQuery(params)}`);
}

export function approveAccessRequest(requestId, modulos) {
  return requestJson(`${CORE_BASE}/contas/solicitacoes/${requestId}/aprovar`, {
    method: "PATCH",
    body: JSON.stringify({ modulos }),
  });
}

export function rejectAccessRequest(requestId, motivo_recusa) {
  return requestJson(`${CORE_BASE}/contas/solicitacoes/${requestId}/recusar`, {
    method: "PATCH",
    body: JSON.stringify({ motivo_recusa }),
  });
}
