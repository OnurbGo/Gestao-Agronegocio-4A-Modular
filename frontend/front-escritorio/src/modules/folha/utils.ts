const camposEditaveis = [
  "dias_trabalhados",
  "inss",
  "irrf",
  "inss_adicional",
  "comissao",
  "desconto_bar",
  "desconto_diverso_1",
  "desconto_diverso_2",
  "desconto_diverso_3",
];

export const descontoCampos = [
  { campo: "desconto_bar", label: "Bar" },
  { campo: "desconto_diverso_1", label: "Desconto diverso 1" },
  { campo: "desconto_diverso_2", label: "Desconto diverso 2" },
  { campo: "desconto_diverso_3", label: "Desconto diverso 3" },
];

export function numero(value: unknown): number {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function dinheiro(value: unknown): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero(value));
}

export function mesAno(ano: number | string, mes: number | string): string {
  return `${String(mes).padStart(2, "0")}/${ano}`;
}

export function possuiImpactoSalarial(impacto) {
  return Boolean(
    impacto?.tem_impacto ||
      impacto?.ferias?.length ||
      impacto?.lancamentos?.length ||
      impacto?.sem_salario?.length,
  );
}

export function totalDescontos(linha) {
  return descontoCampos.reduce(
    (total, item) => total + numero(linha[item.campo]),
    0,
  );
}

export function calcularLinha(linha, recalcularProporcional = false) {
  const salarioProporcional =
    recalcularProporcional || linha.salario_proporcional === ""
      ? (numero(linha.salario_bruto) / 30) * numero(linha.dias_trabalhados)
      : numero(linha.salario_proporcional);
  const salarioLiquido =
    salarioProporcional +
    numero(linha.comissao) -
    numero(linha.inss) -
    numero(linha.irrf) -
    numero(linha.inss_adicional);

  const descontos = totalDescontos(linha);

  return {
    ...linha,
    salario_proporcional: salarioProporcional.toFixed(2),
    salario_liquido: salarioLiquido.toFixed(2),
    salario_liquido_com_desconto: (salarioLiquido - descontos).toFixed(2),
    salario_final_com_ferias: (
      salarioLiquido -
      descontos +
      numero(linha.ferias)
    ).toFixed(2),
  };
}

export function criarLinhaBase(mes) {
  return calcularLinha({
    mes,
    dias_trabalhados: "",
    salario_bruto: "",
    salario_proporcional: "",
    inss: "",
    irrf: "",
    inss_adicional: "",
    ferias: "",
    ferias_automatica: false,
    comissao: "",
    desconto_bar: "",
    desconto_diverso_1: "",
    desconto_diverso_2: "",
    desconto_diverso_3: "",
    salario_liquido: "0.00",
    salario_liquido_com_desconto: "0.00",
    salario_final_com_ferias: "0.00",
  });
}

export function normalizarLinha(registro, mes) {
  if (!registro) return criarLinhaBase(mes);

  return calcularLinha({
    ...criarLinhaBase(mes),
    ...Object.fromEntries(
      Object.entries(registro).map(([key, value]) => [
        key,
        key === "ferias_automatica"
          ? Boolean(value)
          : value === null || value === undefined
            ? ""
            : String(value),
      ]),
    ),
    mes,
  });
}

export function montarPayload(linhas) {
  return linhas.map((linha) => {
    const payload = {
      mes: Number(linha.mes),
      dias_trabalhados: Number(linha.dias_trabalhados || 0),
    };

    camposEditaveis
      .filter((campo) => campo !== "dias_trabalhados")
      .forEach((campo) => {
        payload[campo] = numero(linha[campo]);
      });

    return payload;
  });
}

