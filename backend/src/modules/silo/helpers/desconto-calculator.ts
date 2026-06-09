import { decimal, numero, sacasFromKg } from "./number.utils";

type CalcularDescontoParams = {
  peso_liquido_kg: unknown;
  desconto_umidade_percentual: unknown;
  desconto_impureza_percentual: unknown;
};

export class DescontoCalculator {
  static calcular(params: CalcularDescontoParams) {
    const pesoLiquido = numero(params.peso_liquido_kg);
    const descontoUmidadePercentual = numero(params.desconto_umidade_percentual);
    const descontoImpurezaPercentual = numero(
      params.desconto_impureza_percentual,
    );
    const descontoUmidadeKg = pesoLiquido * (descontoUmidadePercentual / 100);
    const descontoImpurezaKg = pesoLiquido * (descontoImpurezaPercentual / 100);
    const pesoFinalKg = Math.max(
      0,
      pesoLiquido - descontoUmidadeKg - descontoImpurezaKg,
    );

    return {
      desconto_umidade_percentual: decimal(descontoUmidadePercentual, 4),
      desconto_impureza_percentual: decimal(descontoImpurezaPercentual, 4),
      desconto_umidade_kg: decimal(descontoUmidadeKg),
      desconto_impureza_kg: decimal(descontoImpurezaKg),
      peso_final_kg: decimal(pesoFinalKg),
      sacas_final: decimal(sacasFromKg(pesoFinalKg)),
    };
  }
}
