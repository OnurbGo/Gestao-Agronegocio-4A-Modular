import { requestFormData, requestJson } from "@/shared/services/api";

const CORE_BASE = "/api/core";

export function updateProfile(usuarioId, data) {
  return requestJson(`${CORE_BASE}/usuarios/${usuarioId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateProfilePhoto(usuarioId, foto) {
  const formData = new FormData();
  formData.append("foto", foto);

  return requestFormData(`${CORE_BASE}/usuarios/${usuarioId}/foto`, formData, {
    method: "PATCH",
  });
}
