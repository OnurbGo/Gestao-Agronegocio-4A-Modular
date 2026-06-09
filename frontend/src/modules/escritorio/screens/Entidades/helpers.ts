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
  tipo_pessoa: "FISICA",
  email: "",
  telefone: "",
  celular: "",
  cidade: "",
  estado: "",
  data_admissao: "",
  observacao: "",
  tipos: ["CLIENTE"],
};

export function onlyDigits(value = ""): string {
  return String(value).replace(/\D/g, "");
}

export function formatCpfCnpj(value = ""): string {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
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
  return tipoPessoaOptions.find((item) => item.value === value)?.label || value || "";
}

export function normalizeForm(entidade?: Entidade | null): EntidadeFormData {
  if (!entidade) {
    return emptyForm;
  }

  return {
    nome: entidade.nome || "",
    cpf_cnpj: formatCpfCnpj(entidade.cpf_cnpj || ""),
    tipo_pessoa: entidade.tipo_pessoa || "FISICA",
    email: entidade.email || "",
    telefone: formatPhone(entidade.telefone || ""),
    celular: formatPhone(entidade.celular || ""),
    cidade: entidade.cidade || "",
    estado: entidade.estado || "",
    data_admissao: entidade.data_admissao || "",
    observacao: entidade.observacao || "",
    tipos: entidade.tipos?.length ? entidade.tipos : ["CLIENTE"],
  };
}

export function montarPayload(form: EntidadeFormData) {
  return {
    nome: (form.nome || "").trim(),
    cpf_cnpj: onlyDigits(form.cpf_cnpj),
    tipo_pessoa: form.tipo_pessoa || "FISICA",
    email: (form.email || "").trim(),
    telefone: onlyDigits(form.telefone),
    celular: onlyDigits(form.celular),
    cidade: (form.cidade || "").trim(),
    estado: (form.estado || "").trim().toUpperCase(),
    data_admissao: form.data_admissao || null,
    observacao: (form.observacao || "").trim(),
    tipos: form.tipos?.length ? form.tipos : ["CLIENTE"],
  };
}

