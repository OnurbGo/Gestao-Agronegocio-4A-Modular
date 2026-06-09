import { BadRequestException } from "@nestjs/common";
import type { FolhaMensalInput } from "../dto/folha.dto";
import type { FolhaMensal } from "../entities/folha-mensal.entity";
import {
  addDays,
  dateOnlyValue,
  formatDateOnly,
  monthEndDateOnly,
  monthStartDateOnly,
  parseDateOnly,
} from "./folha-date.utils";
import { decimal, numero } from "./folha-number.utils";

export type LinhaFolha = Partial<FolhaMensalInput["linhas"][number]> & {
  mes: number;
  salario_bruto?: unknown;
  salario_proporcional?: unknown;
  ferias?: unknown;
  ferias_automatica?: boolean;
};

export type RegistroSalarialLike = {
  id_registro_salarial?: unknown;
  inicio_vigencia: unknown;
  fim_vigencia?: unknown;
  salario?: unknown;
};

export function periodoRegistroSalarial(registro: Record<string, unknown>) {
  return {
    inicio: dateOnlyValue(registro.inicio_vigencia),
    fim: dateOnlyValue(registro.fim_vigencia) || null,
  };
}

export function impactaPeriodos(
  inicio: string,
  fim: string,
  periodos: Array<{ inicio: string; fim: string | null }>,
) {
  return periodos.some((periodo) =>
    periodoSobrepoe(inicio, fim, periodo.inicio, periodo.fim),
  );
}

export function periodoSobrepoe(
  inicioA: string,
  fimA: string | null,
  inicioB: string,
  fimB: string | null,
) {
  const fimAComparacao = fimA || "9999-12-31";
  const fimBComparacao = fimB || "9999-12-31";
  return inicioA <= fimBComparacao && inicioB <= fimAComparacao;
}

export function temSalarioCompletoPeriodo(
  inicio: string,
  fim: string,
  registrosSalariais: RegistroSalarialLike[],
) {
  const inicioDate = parseDateOnly(inicio);
  const fimDate = parseDateOnly(fim);

  for (
    let cursor = inicioDate;
    cursor.getTime() <= fimDate.getTime();
    cursor = addDays(cursor, 1)
  ) {
    if (!encontrarSalarioVigenteEm(formatDateOnly(cursor), registrosSalariais)) {
      return false;
    }
  }

  return true;
}

export function diasComSalarioParaTrabalhoMensal(
  diasTrabalhados: number,
  registrosSalariais: RegistroSalarialLike[],
  ano: number,
  mes: number,
) {
  if (diasTrabalhados <= 0) return 0;

  let diasCalculados = 0;
  const inicioDate = parseDateOnly(monthStartDateOnly(ano, mes));
  const fimDate = parseDateOnly(monthEndDateOnly(ano, mes));

  for (
    let cursor = inicioDate;
    cursor.getTime() <= fimDate.getTime() && diasCalculados < diasTrabalhados;
    cursor = addDays(cursor, 1)
  ) {
    const data = formatDateOnly(cursor);

    if (encontrarSalarioVigenteEm(data, registrosSalariais)) {
      diasCalculados += 1;
    }
  }

  return diasCalculados;
}

export function formatarMesAno(ano: number, mes: number) {
  return `${String(mes).padStart(2, "0")}/${ano}`;
}

export function calcularValorPeriodoComSalarios(
  inicio: string,
  fim: string,
  registrosSalariais: RegistroSalarialLike[],
  exigirSalario = true,
) {
  let total = 0;
  const inicioDate = parseDateOnly(inicio);
  const fimDate = parseDateOnly(fim);

  for (
    let cursor = inicioDate;
    cursor.getTime() <= fimDate.getTime();
    cursor = addDays(cursor, 1)
  ) {
    const data = formatDateOnly(cursor);
    const salario = encontrarSalarioVigenteEm(data, registrosSalariais);

    if (!salario) {
      if (exigirSalario) {
        throw new BadRequestException(
          `Não existe registro salarial para o período informado. Verifique a data ${data}.`,
        );
      }
      continue;
    }

    total += numero(salario.salario) / 30;
  }

  return total;
}

export function encontrarSalarioVigenteEm(
  data: string,
  registrosSalariais: RegistroSalarialLike[],
) {
  return registrosSalariais
    .filter((registro) => {
      const inicio = dateOnlyValue(registro.inicio_vigencia);
      const fim = dateOnlyValue(registro.fim_vigencia);
      return inicio <= data && (!fim || fim >= data);
    })
    .sort((a, b) =>
      dateOnlyValue(b.inicio_vigencia).localeCompare(
        dateOnlyValue(a.inicio_vigencia),
      ),
    )[0];
}

export function buscarSalarioMensalVigenteMes(
  registrosSalariais: RegistroSalarialLike[],
  ano: number,
  mes: number,
) {
  const inicioMes = monthStartDateOnly(ano, mes);
  const salarioInicioMes = encontrarSalarioVigenteEm(
    inicioMes,
    registrosSalariais,
  );
  const primeiroSalarioMes = registrosSalariais[0];
  return numero((salarioInicioMes || primeiroSalarioMes)?.salario);
}

export function calcularSalarioProporcionalDiasMes(
  diasTrabalhados: number,
  registrosSalariais: RegistroSalarialLike[],
  ano: number,
  mes: number,
  exigirSalario: boolean,
) {
  if (diasTrabalhados <= 0) {
    return 0;
  }

  const inicioMes = monthStartDateOnly(ano, mes);
  const fimMes = monthEndDateOnly(ano, mes);
  const salarioMesInteiro = encontrarSalarioVigenteEm(
    inicioMes,
    registrosSalariais,
  );
  const cobreMesInteiro =
    salarioMesInteiro &&
    (!dateOnlyValue(salarioMesInteiro.fim_vigencia) ||
      dateOnlyValue(salarioMesInteiro.fim_vigencia) >= fimMes);

  if (cobreMesInteiro) {
    return (numero(salarioMesInteiro.salario) / 30) * diasTrabalhados;
  }

  let total = 0;
  let diasCalculados = 0;
  const inicioDate = parseDateOnly(inicioMes);
  const fimDate = parseDateOnly(fimMes);

  for (
    let cursor = inicioDate;
    cursor.getTime() <= fimDate.getTime() && diasCalculados < diasTrabalhados;
    cursor = addDays(cursor, 1)
  ) {
    const data = formatDateOnly(cursor);
    const salario = encontrarSalarioVigenteEm(data, registrosSalariais);

    if (!salario) {
      continue;
    }

    total += numero(salario.salario) / 30;
    diasCalculados += 1;
  }

  if (exigirSalario && diasCalculados < diasTrabalhados) {
    throw new BadRequestException(
      `Não existe registro salarial para todos os dias trabalhados em ${String(
        mes,
      ).padStart(2, "0")}/${ano}.`,
    );
  }

  return total;
}

export function linhaBaseLancamento(
  lancamento: FolhaMensal | null,
  mes: number,
): LinhaFolha {
  const plain = lancamento?.get({ plain: true }) as
    | Record<string, unknown>
    | undefined;

  return {
    mes,
    dias_trabalhados: numero(plain?.dias_trabalhados),
    salario_bruto: numero(plain?.salario_bruto),
    salario_proporcional: numero(plain?.salario_proporcional),
    inss: numero(plain?.inss),
    irrf: numero(plain?.irrf),
    inss_adicional: numero(plain?.inss_adicional),
    ferias: numero(plain?.ferias),
    ferias_automatica: Boolean(plain?.ferias_automatica),
    comissao: numero(plain?.comissao),
    desconto_bar: numero(plain?.desconto_bar),
    desconto_diverso_1: numero(plain?.desconto_diverso_1),
    desconto_diverso_2: numero(plain?.desconto_diverso_2),
    desconto_diverso_3: numero(plain?.desconto_diverso_3),
  };
}

export function calcularLinha(linha: LinhaFolha) {
  const salarioProporcional = numero(linha.salario_proporcional);
  const salario_liquido =
    salarioProporcional +
    numero(linha.comissao) -
    numero(linha.inss) -
    numero(linha.irrf) -
    numero(linha.inss_adicional);

  const descontos =
    numero(linha.desconto_bar) +
    numero(linha.desconto_diverso_1) +
    numero(linha.desconto_diverso_2) +
    numero(linha.desconto_diverso_3);

  return {
    mes: linha.mes,
    dias_trabalhados: numero(linha.dias_trabalhados),
    salario_bruto: decimal(linha.salario_bruto),
    salario_mensal_vigente: decimal(linha.salario_bruto),
    salario_proporcional: decimal(salarioProporcional),
    inss: decimal(linha.inss),
    irrf: decimal(linha.irrf),
    inss_adicional: decimal(linha.inss_adicional),
    ferias: decimal(linha.ferias),
    ferias_automatica: Boolean(linha.ferias_automatica),
    comissao: decimal(linha.comissao),
    salario_liquido: decimal(salario_liquido),
    desconto_bar: decimal(linha.desconto_bar),
    desconto_diverso_1: decimal(linha.desconto_diverso_1),
    desconto_diverso_2: decimal(linha.desconto_diverso_2),
    desconto_diverso_3: decimal(linha.desconto_diverso_3),
    salario_liquido_com_desconto: decimal(salario_liquido - descontos),
    salario_final_com_ferias: decimal(
      salario_liquido - descontos + numero(linha.ferias),
    ),
  };
}

export type LinhaCalculada = ReturnType<typeof calcularLinha>;
