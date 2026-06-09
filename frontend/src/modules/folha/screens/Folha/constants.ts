import type { SalaryForm, VacationForm, VacationSummary } from "@/shared/types";

export const meses = [
  { valor: 1, label: "Janeiro" },
  { valor: 2, label: "Fevereiro" },
  { valor: 3, label: "Março" },
  { valor: 4, label: "Abril" },
  { valor: 5, label: "Maio" },
  { valor: 6, label: "Junho" },
  { valor: 7, label: "Julho" },
  { valor: 8, label: "Agosto" },
  { valor: 9, label: "Setembro" },
  { valor: 10, label: "Outubro" },
  { valor: 11, label: "Novembro" },
  { valor: 12, label: "Dezembro" },
];

export const PARTICIPANTS_PAGE_SIZE = 10;
export const ENTITIES_MODAL_PAGE_SIZE = 10;
export const SALARY_PAGE_SIZE = 5;
export const VACATION_PAGE_SIZE = 5;

export const salarioInicial: SalaryForm = {
  inicio_vigencia: "",
  fim_vigencia: "",
  salario: "",
  percentual: "",
  observacao: "",
};

export const feriasInicial: VacationForm = {
  inicio_gozado: "",
  fim_gozado: "",
  valor_abono: "",
};

export const feriasSummaryInicial: VacationSummary = {
  referencia_inicio: null,
  periodo_aquisitivo_inicio: null,
  periodo_aquisitivo_fim: null,
  anos_aquisitivos: 0,
  dias_adquiridos: 0,
  total_dias_gozados: 0,
  saldo_ferias_dias: 0,
};
