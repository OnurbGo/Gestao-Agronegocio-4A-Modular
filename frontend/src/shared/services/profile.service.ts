import { requestFormData, requestJson } from "@/shared/services/api";
import type { AuthUser } from "@/shared/types";

const CORE_BASE = "/api/core";

type ProfilePayload = {
  nome: string;
  observacao: string | null;
};

export function updateProfile(
  usuarioId: number,
  data: ProfilePayload,
): Promise<AuthUser> {
  return requestJson<AuthUser>(`${CORE_BASE}/usuarios/${usuarioId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateProfilePhoto(
  usuarioId: number,
  foto: File,
): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("foto", foto);

  return requestFormData<AuthUser>(
    `${CORE_BASE}/usuarios/${usuarioId}/foto`,
    formData,
    {
      method: "PATCH",
    },
  );
}
