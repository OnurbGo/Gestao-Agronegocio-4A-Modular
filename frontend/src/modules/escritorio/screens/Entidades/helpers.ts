import type { Entidade, EntidadeFormData } from "@/shared/types";

export const tipoOptions = [
  "FUNCIONARIO",
  "PROPRIETARIO",
  "CLIENTE",
  "ARRENDATARIO",
];

export const tipoPessoaOptions = [
  { value: "FISICA", label: "Física" },
  { value: "JURIDICA", label: "Jurídica" },
];

export const PAGE_SIZE = 10;

export const emptyForm: EntidadeFormData = {
  nome: "",
  cpf_cnpj: "",
  rg: "",
  tipo_pessoa: "FISICA",
  email: "",
  telefone: "",
  celular: "",
  cidade: "",
  estado: "",
  data_nascimento: "",
  data_admissao: "",
  observacao: "",
  tipos: ["CLIENTE"],
};

export function onlyDigits(value = ""): string {
  return String(value).replace(/\D/g, "");
}

function hasRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

export function formatCpf(value = ""): string {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatCnpj(value = ""): string {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatDocumentoPorTipo(value = "", tipoPessoa = "FISICA"): string {
  return tipoPessoa === "JURIDICA" ? formatCnpj(value) : formatCpf(value);
}

export function formatCpfCnpj(value = ""): string {
  const digits = onlyDigits(value);
  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}

export function getDocumentoLabel(tipoPessoa = "FISICA"): string {
  return tipoPessoa === "JURIDICA" ? "CNPJ" : "CPF";
}

export function getDocumentoMaxLength(tipoPessoa = "FISICA"): number {
  return tipoPessoa === "JURIDICA" ? 18 : 14;
}

export function isDocumentoLengthCompatible(
  value = "",
  tipoPessoa = "FISICA",
): boolean {
  const expectedLength = tipoPessoa === "JURIDICA" ? 14 : 11;
  const digits = onlyDigits(value);
  return !digits || digits.length === expectedLength;
}

export function isValidCpf(value = ""): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || hasRepeatedDigits(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let digit = (sum * 10) % 11;
  if (digit === 10) {
    digit = 0;
  }

  if (digit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  digit = (sum * 10) % 11;
  if (digit === 10) {
    digit = 0;
  }

  return digit === Number(cpf[10]);
}

function getCnpjDigit(cnpj: string, weights: number[]): number {
  const sum = weights.reduce(
    (total, weight, index) => total + Number(cnpj[index]) * weight,
    0,
  );
  const remainder = sum % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value = ""): boolean {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14 || hasRepeatedDigits(cnpj)) {
    return false;
  }

  const firstDigit = getCnpjDigit(
    cnpj,
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const secondDigit = getCnpjDigit(
    cnpj,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

export function getDocumentoValidationMessage(
  value = "",
  tipoPessoa = "FISICA",
): string | null {
  if (tipoPessoa === "JURIDICA") {
    return isValidCnpj(value) ? null : "Informe um CNPJ valido.";
  }

  return isValidCpf(value) ? null : "Informe um CPF valido.";
}

export function formatPhone(value = ""): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function tipoPessoaLabel(value?: string): string {
  return (
    tipoPessoaOptions.find((item) => item.value === value)?.label || value || ""
  );
}

export function normalizeForm(entidade?: Entidade | null): EntidadeFormData {
  if (!entidade) {
    return emptyForm;
  }

  const tipoPessoa = entidade.tipo_pessoa || "FISICA";

  return {
    nome: entidade.nome || "",
    cpf_cnpj: formatDocumentoPorTipo(entidade.cpf_cnpj || "", tipoPessoa),
    rg: entidade.rg || "",
    tipo_pessoa: tipoPessoa,
    email: entidade.email || "",
    telefone: formatPhone(entidade.telefone || ""),
    celular: formatPhone(entidade.celular || ""),
    cidade: entidade.cidade || "",
    estado: entidade.estado || "",
    data_nascimento: entidade.data_nascimento?.slice(0, 10) || "",
    data_admissao: entidade.data_admissao || "",
    observacao: entidade.observacao || "",
    tipos: entidade.tipos?.length ? entidade.tipos : ["CLIENTE"],
  };
}

export function montarPayload(form: EntidadeFormData) {
  const tipoPessoa = form.tipo_pessoa || "FISICA";
  const isPessoaFisica = tipoPessoa === "FISICA";

  return {
    nome: (form.nome || "").trim(),
    cpf_cnpj: onlyDigits(form.cpf_cnpj),
    rg: isPessoaFisica ? (form.rg || "").trim() || null : null,
    tipo_pessoa: tipoPessoa,
    email: (form.email || "").trim() || null,
    telefone: onlyDigits(form.telefone),
    celular: onlyDigits(form.celular),
    cidade: (form.cidade || "").trim(),
    estado: (form.estado || "").trim().toUpperCase(),
    data_nascimento: isPessoaFisica ? form.data_nascimento || null : null,
    data_admissao: form.data_admissao || null,
    observacao: (form.observacao || "").trim(),
    tipos: form.tipos?.length ? form.tipos : ["CLIENTE"],
  };
}
