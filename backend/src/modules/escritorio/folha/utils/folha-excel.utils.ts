import ExcelJS from "exceljs";
import { numero } from "./folha-number.utils";

export const meses = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const camposMoeda = [
  "salario_bruto",
  "salario_proporcional",
  "inss",
  "irrf",
  "inss_adicional",
  "comissao",
  "salario_liquido",
  "desconto_bar",
  "desconto_diverso_1",
  "desconto_diverso_2",
  "desconto_diverso_3",
  "salario_liquido_com_desconto",
  "salario_final_com_ferias",
];

export function configurarColunas(
  sheet: ExcelJS.Worksheet,
  incluirParticipante = false,
) {
  const columns = [
    ...(incluirParticipante
      ? [{ header: "Participante", key: "participante", width: 30 }]
      : []),
    { header: "Mes", key: "mes", width: 14 },
    { header: "Dias trabalhados", key: "dias_trabalhados", width: 18 },
    { header: "Salario mensal", key: "salario_bruto", width: 16 },
    { header: "Salario proporcional", key: "salario_proporcional", width: 22 },
    { header: "INSS", key: "inss", width: 14 },
    { header: "IRRF", key: "irrf", width: 14 },
    { header: "INSS adicional", key: "inss_adicional", width: 16 },
    { header: "Comissao", key: "comissao", width: 14 },
    { header: "Salario liquido", key: "salario_liquido", width: 17 },
    { header: "Desconto bar", key: "desconto_bar", width: 15 },
    { header: "Desconto diverso 1", key: "desconto_diverso_1", width: 18 },
    { header: "Desconto diverso 2", key: "desconto_diverso_2", width: 18 },
    { header: "Desconto diverso 3", key: "desconto_diverso_3", width: 18 },
    {
      header: "Liquido com desconto",
      key: "salario_liquido_com_desconto",
      width: 20,
    },
    {
      header: "Final + ferias",
      key: "salario_final_com_ferias",
      width: 18,
    },
  ];

  sheet.addRow(columns.map((column) => column.header));
  columns.forEach((column, index) => {
    const sheetColumn = sheet.getColumn(index + 1);
    sheetColumn.key = column.key;
    sheetColumn.width = column.width;
  });
  sheet.lastRow!.font = { bold: true };
}

export function linhaPlanilha(
  lancamento: Record<string, unknown>,
  incluirParticipante = false,
) {
  const row: Record<string, unknown> = {
    ...(incluirParticipante
      ? { participante: (lancamento.entidade as { nome?: string })?.nome }
      : {}),
    mes: meses[Number(lancamento.mes) - 1],
    dias_trabalhados: lancamento.dias_trabalhados,
  };

  camposMoeda.forEach((campo) => {
    row[campo] = numero(lancamento[campo]);
  });

  return row;
}

export function adicionarTotal(
  sheet: ExcelJS.Worksheet,
  lancamentos: Record<string, unknown>[],
) {
  const total = lancamentos.reduce(
    (soma, item) => soma + numero(item.salario_final_com_ferias),
    0,
  );
  const row = sheet.addRow([]);
  row.getCell(1).value = "Total final com ferias";
  row.getCell(sheet.columnCount).value = total;
  row.font = { bold: true };
}

export function criarWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gestao Agronegocio 4A";
  workbook.created = new Date();
  return workbook;
}

export async function getWorkbookBuffer(workbook: ExcelJS.Workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

export function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
