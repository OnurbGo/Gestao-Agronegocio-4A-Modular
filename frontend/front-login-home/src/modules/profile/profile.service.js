import { requestJson } from "../../shared/services/api";

const CORE_BASE = "/api/core";

export function updateProfile(usuarioId, data) {
  return requestJson(`${CORE_BASE}/usuarios/${usuarioId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
