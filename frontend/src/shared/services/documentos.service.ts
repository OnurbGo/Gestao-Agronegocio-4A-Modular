import {
  downloadFile,
  getToken,
  requestFormData,
  requestJson,
  toQuery,
} from "@/shared/services/api";
import type {
  ArquivoDocumento,
  DocumentoOrigem,
  TipoDocumento,
} from "@/shared/types";

const BASE = "/api/escritorio";

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return typeof record.message === "string"
    ? record.message
    : typeof record.error === "string"
      ? record.error
      : null;
}

export function listarTiposDocumento(): Promise<TipoDocumento[]> {
  return requestJson<TipoDocumento[]>(`${BASE}/tipos-documento`);
}

export function listarArquivosEntidade(id: number): Promise<ArquivoDocumento[]> {
  return requestJson<ArquivoDocumento[]>(`${BASE}/entidades/${id}/arquivos`);
}

export function listarArquivosImovel(id: number): Promise<ArquivoDocumento[]> {
  return requestJson<ArquivoDocumento[]>(`${BASE}/imoveis/${id}/arquivos`);
}

export function enviarArquivoEntidade(
  id: number,
  formData: FormData,
): Promise<ArquivoDocumento> {
  return requestFormData<ArquivoDocumento>(
    `${BASE}/entidades/${id}/arquivos`,
    formData,
  );
}

export function enviarArquivoImovel(
  id: number,
  formData: FormData,
): Promise<ArquivoDocumento> {
  return requestFormData<ArquivoDocumento>(
    `${BASE}/imoveis/${id}/arquivos`,
    formData,
  );
}

export function baixarArquivo(
  id: number,
  origem: DocumentoOrigem,
  nome?: string,
): Promise<void> {
  return downloadFile(
    `${BASE}/arquivos/${id}/download${toQuery({ origem })}`,
    nome || `arquivo-${id}`,
  );
}

function isPreviewable(type = ""): boolean {
  return (
    type.startsWith("image/") ||
    type.startsWith("text/") ||
    type === "application/pdf"
  );
}

export async function visualizarArquivo(
  id: number,
  origem: DocumentoOrigem,
  nome?: string,
): Promise<void> {
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
      getPayloadMessage(payload) ||
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

export function removerArquivo(
  id: number,
  origem: DocumentoOrigem,
): Promise<unknown> {
  return requestJson(`${BASE}/arquivos/${id}${toQuery({ origem })}`, {
    method: "DELETE",
  });
}
