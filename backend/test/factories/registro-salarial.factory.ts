import type { RegistroSalarialInput } from "../../src/modules/escritorio/folha/dto/folha.dto";

export function makeRegistroSalarialPlain(
  overrides: Record<string, unknown> = {},
) {
  return {
    id_registro_salarial: 1,
    entidade_id: 1,
    inicio_vigencia: "2024-01-01",
    fim_vigencia: null,
    salario: "3000.00",
    percentual: null,
    observacao: null,
    ...overrides,
  };
}

export function makeRegistroSalarialModel(
  overrides: Record<string, unknown> = {},
) {
  const plain = makeRegistroSalarialPlain(overrides);

  return {
    ...plain,
    destroy: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue(plain),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

export function makeRegistroSalarialPayload(
  overrides: Partial<RegistroSalarialInput> = {},
): RegistroSalarialInput {
  return {
    inicio_vigencia: "2024-01-01",
    fim_vigencia: null,
    salario: 3000,
    percentual: null,
    observacao: null,
    ...overrides,
  };
}
