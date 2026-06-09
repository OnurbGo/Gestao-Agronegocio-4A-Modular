import type { Imovel, ImovelFormData } from "@/shared/types";

export const PAGE_SIZE = 10;

export const emptyForm: ImovelFormData = {
  nome: "",
  lote: "",
  municipio: "",
  n_lote: "",
  gleba: "",
  colonia: "",
  matricula: "",
  nirf: "",
  incra: "",
  proprietarios_ids: [],
  area_total: "",
  observacao: "",
};

export function mascaraNirf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 1) return d;
  if (d.length <= 4) return `${d[0]}.${d.slice(1)}`;
  if (d.length <= 7) return `${d[0]}.${d.slice(1, 4)}.${d.slice(4)}`;
  return `${d[0]}.${d.slice(1, 4)}.${d.slice(4, 7)}-${d[7]}`;
}

export function mascaraIncra(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length <= 12)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}.${d.slice(9)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}.${d.slice(9, 12)}-${d[12]}`;
}

export function mascaraMatricula(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 9);
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function normalizeForm(imovel?: Imovel | null): ImovelFormData {
  if (!imovel) return emptyForm;
  return {
    nome: imovel.nome || "",
    lote: imovel.lote || "",
    municipio: imovel.municipio || "",
    n_lote: imovel.n_lote || "",
    gleba: imovel.gleba || "",
    colonia: imovel.colonia || "",
    matricula: imovel.matricula || "",
    nirf: imovel.nirf || "",
    incra: imovel.incra || "",
    proprietarios_ids: imovel.proprietarios?.map((p) => p.id_entidade) ?? [],
    area_total: String(imovel.area_total || ""),
    observacao: imovel.observacao || "",
  };
}

export function montarPayload(form: ImovelFormData) {
  return {
    nome: form.nome,
    lote: form.lote,
    municipio: form.municipio,
    n_lote: form.n_lote,
    gleba: form.gleba,
    colonia: form.colonia,
    matricula: form.matricula,
    nirf: form.nirf,
    incra: form.incra,
    proprietarios_ids: form.proprietarios_ids,
    area_total: form.area_total,
    observacao: form.observacao,
  };
}

export function calcularAlqueires(ha: string | number): string {
  const valor = parseFloat(String(ha));
  if (!ha || isNaN(valor) || valor <= 0) return "";
  return (valor / 2.42).toFixed(4);
}

export function formatArea(value: string | number | undefined): string {
  const alqueires = calcularAlqueires(value || "");
  return alqueires ? `${alqueires} alq` : "-";
}

