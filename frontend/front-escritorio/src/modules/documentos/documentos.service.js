import {
  downloadFile,
  getToken,
  requestFormData,
  requestJson,
  toQuery,
} from "../../shared/services/api";

const BASE = "/api/escritorio";

export function listarTiposDocumento() {
  return requestJson(`${BASE}/tipos-documento`);
}

export function listarArquivosEntidade(id) {
  return requestJson(`${BASE}/entidades/${id}/arquivos`);
}

export function listarArquivosImovel(id) {
  return requestJson(`${BASE}/imoveis/${id}/arquivos`);
}

export function enviarArquivoEntidade(id, formData) {
  return requestFormData(`${BASE}/entidades/${id}/arquivos`, formData);
}

export function enviarArquivoImovel(id, formData) {
  return requestFormData(`${BASE}/imoveis/${id}/arquivos`, formData);
}

export function baixarArquivo(id, origem, nome) {
  return downloadFile(
    `${BASE}/arquivos/${id}/download${toQuery({ origem })}`,
    nome || `arquivo-${id}`,
  );
}

function isPreviewable(type = "") {
  return (
    type.startsWith("image/") ||
    type.startsWith("text/") ||
    type === "application/pdf"
  );
}

export async function visualizarArquivo(id, origem, nome) {
  const token = getToken();

  const response = await fetch(
    `${BASE}/arquivos/${id}/visualizar${toQuery({ origem })}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.message ||
        payload?.error ||
        "Nao foi possivel visualizar o arquivo.",
    );
  }

  const contentType = response.headers.get("Content-Type") || "";

  if (!isPreviewable(contentType)) {
    await baixarArquivo(id, origem, nome);
    return;
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  window.open(objectUrl, "_blank");
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
}

export function removerArquivo(id, origem) {
  return requestJson(`${BASE}/arquivos/${id}${toQuery({ origem })}`, {
    method: "DELETE",
  });
}
