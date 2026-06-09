import { decimal, numero, sacasFromKg } from "./number.utils";

export class PesoCalculator {
  static calcularPesoLiquidoKg(pesagem1Kg: unknown, pesagem2Kg: unknown) {
    return decimal(Math.abs(numero(pesagem1Kg) - numero(pesagem2Kg)));
  }

  static calcularSacas(pesoKg: unknown) {
    return decimal(sacasFromKg(pesoKg));
  }
}
