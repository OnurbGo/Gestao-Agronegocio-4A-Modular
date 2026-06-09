import { BadRequestException } from "@nestjs/common";

const DIA_MS = 86400000;

export type SegmentoMensal = {
  ano: number;
  mes: number;
  inicio: string;
  fim: string;
  dias: number;
};

export function hojeDateOnly() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function validarData(value: string, label: string) {
  const data = parseDateOnly(value, label);
  return formatDateOnly(data);
}

export function validarOrdemDatas(
  inicio: string,
  fim: string | null,
  labelFim: string,
) {
  if (fim && fim < inicio) {
    throw new BadRequestException(`${labelFim} deve ser maior ou igual ao inicio.`);
  }
}

export function parseDateOnly(value: string, label = "Data") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    throw new BadRequestException(`${label} invalida.`);
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(`${label} invalida.`);
  }

  return date;
}

export function dateOnlyValue(value: unknown) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

export function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DIA_MS);
}

export function diasInclusivos(inicio: string, fim: string) {
  const inicioDate = parseDateOnly(inicio);
  const fimDate = parseDateOnly(fim);
  return Math.floor((fimDate.getTime() - inicioDate.getTime()) / DIA_MS) + 1;
}

export function dividirPeriodoPorMes(inicio: string, fim: string): SegmentoMensal[] {
  const segmentos: SegmentoMensal[] = [];
  let cursor = parseDateOnly(inicio);
  const fimDate = parseDateOnly(fim);

  while (cursor.getTime() <= fimDate.getTime()) {
    const ano = cursor.getUTCFullYear();
    const mes = cursor.getUTCMonth() + 1;
    const fimMes = parseDateOnly(monthEndDateOnly(ano, mes));
    const segmentoFim =
      fimMes.getTime() < fimDate.getTime() ? fimMes : fimDate;
    const segmentoInicio = formatDateOnly(cursor);
    const segmentoFimValor = formatDateOnly(segmentoFim);

    segmentos.push({
      ano,
      mes,
      inicio: segmentoInicio,
      fim: segmentoFimValor,
      dias: diasInclusivos(segmentoInicio, segmentoFimValor),
    });

    cursor = addDays(segmentoFim, 1);
  }

  return segmentos;
}

export function monthStartDateOnly(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
}

export function monthEndDateOnly(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);
}

export function maxDateOnly(a: string, b: string) {
  return a > b ? a : b;
}

export function minDateOnly(a: string, b: string) {
  return a < b ? a : b;
}
