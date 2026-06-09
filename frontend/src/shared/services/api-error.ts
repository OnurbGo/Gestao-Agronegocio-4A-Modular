type ApiErrorPayload = {
  data?: unknown;
  errors?: unknown;
  error?: unknown;
  message?: unknown;
  response?: {
    data?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function traduzirErro(message: unknown): string {
  if (typeof message !== "string") {
    return String(message);
  }

  if (/property \w+ should not exist/.test(message)) {
    return "Campo desconhecido enviado ao servidor";
  }
  if (/\w+ should not be empty/.test(message)) {
    return "Campo obrigatório não preenchido";
  }
  if (/\w+ must be a string/.test(message)) {
    return "Valor inválido: deve ser texto";
  }
  if (/\w+ must be an integer number/.test(message)) {
    return "Deve ser um número inteiro";
  }
  if (/\w+ must be a number/.test(message)) {
    return "Deve ser um número válido";
  }
  if (/\w+ must be a valid enum value/.test(message)) {
    return "Valor selecionado inválido";
  }
  if (/\w+ must be a boolean/.test(message)) {
    return "Valor deve ser verdadeiro ou falso";
  }

  return message;
}

function getIssueMessage(issue: unknown): string | null {
  if (!issue) {
    return null;
  }

  const field = isRecord(issue) ? issue.field || issue.path : undefined;
  const message = isRecord(issue) ? issue.message || issue : issue;

  return field ? `${field}: ${message}` : traduzirErro(message);
}

function extractFromPayload(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.map(getIssueMessage).filter(Boolean).join("\n");
  }

  if (Array.isArray(payload.message)) {
    return [...new Set(payload.message.map(traduzirErro))]
      .filter(Boolean)
      .join("\n");
  }

  if (payload.message && typeof payload.message === "object") {
    return extractFromPayload(payload.message);
  }

  if (typeof payload.message === "string") {
    return traduzirErro(payload.message);
  }

  if (typeof payload.error === "string") {
    return traduzirErro(payload.error);
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a ação.",
): string {
  if (isRecord(error)) {
    const apiError = error as ApiErrorPayload;
    const fromResponse = extractFromPayload(apiError.response?.data);
    const fromData = extractFromPayload(apiError.data);
    const fromPayload = extractFromPayload(apiError);

    if (fromResponse) return fromResponse;
    if (fromData) return fromData;
    if (fromPayload) return fromPayload;
  }

  if (error instanceof Error && error.message) {
    return traduzirErro(error.message);
  }

  return fallback;
}
