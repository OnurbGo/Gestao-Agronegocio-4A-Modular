import { BadRequestException } from "@nestjs/common";
import {
  calcularLinha,
  calcularSalarioProporcionalDiasMes,
  calcularValorPeriodoComSalarios,
  encontrarSalarioVigenteEm,
} from "./folha-calculo.utils";

describe("folha-calculo.utils", () => {
  const registros = [
    {
      id_registro_salarial: 1,
      inicio_vigencia: "2024-01-01",
      fim_vigencia: "2024-01-15",
      salario: "3000.00",
    },
    {
      id_registro_salarial: 2,
      inicio_vigencia: "2024-01-16",
      fim_vigencia: null,
      salario: "3600.00",
    },
  ];

  it("deve buscar salário vigente pela data", () => {
    expect(encontrarSalarioVigenteEm("2024-01-10", registros)).toMatchObject({
      id_registro_salarial: 1,
    });
    expect(encontrarSalarioVigenteEm("2024-02-01", registros)).toMatchObject({
      id_registro_salarial: 2,
    });
  });

  it("deve calcular valor de férias considerando salários do período", () => {
    const total = calcularValorPeriodoComSalarios(
      "2024-01-14",
      "2024-01-17",
      registros,
    );

    expect(total).toBe(440);
  });

  it("deve rejeitar férias em período sem salário quando exigido", () => {
    expect(() =>
      calcularValorPeriodoComSalarios("2023-12-01", "2023-12-02", registros),
    ).toThrow(BadRequestException);
  });

  it("deve calcular salário proporcional aos dias trabalhados no mês", () => {
    const total = calcularSalarioProporcionalDiasMes(
      20,
      registros,
      2024,
      1,
      true,
    );

    expect(total).toBe(2100);
  });

  it("deve calcular totais de linha mensal com descontos", () => {
    const linha = calcularLinha({
      mes: 1,
      dias_trabalhados: 30,
      salario_bruto: 3000,
      salario_proporcional: 3000,
      inss: 300,
      irrf: 100,
      inss_adicional: 50,
      ferias: 500,
      comissao: 200,
      desconto_bar: 10,
      desconto_diverso_1: 20,
      desconto_diverso_2: 30,
      desconto_diverso_3: 40,
    });

    expect(linha.salario_liquido).toBe("2750.00");
    expect(linha.salario_liquido_com_desconto).toBe("2650.00");
    expect(linha.salario_final_com_ferias).toBe("3150.00");
  });
});
