import type { FeriasInput } from "../../src/modules/escritorio/folha/dto/folha.dto";

export function makeFeriasPlain(overrides: Record<string, unknown> = {}) {
  return {
    id_ferias: 1,
    entidade_id: 1,
    inicio_gozado: "2024-02-01",
    fim_gozado: "2024-02-10",
    dias_gozados: 10,
    valor_ferias: "1000.00",
    valor_abono: "0.00",
    ...overrides,
  };
}

export function makeFeriasModel(overrides: Record<string, unknown> = {}) {
  const plain = makeFeriasPlain(overrides);

  return {
    ...plain,
    destroy: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue(plain),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

export function makeFeriasPayload(
  overrides: Partial<FeriasInput> = {},
): FeriasInput {
  return {
    inicio_gozado: "2024-02-01",
    fim_gozado: "2024-02-10",
    valor_abono: 0,
    ...overrides,
  };
}
