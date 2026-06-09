import type { EntidadeInput } from "../../src/modules/escritorio/entidades/dto/entidades.dto";

export function makeEntidadePlain(overrides: Record<string, unknown> = {}) {
  return {
    id_entidade: 1,
    nome: "João da Silva",
    cpf_cnpj: "12345678901",
    tipo_pessoa: "FISICA" as const,
    participa_folha: true,
    data_admissao: "2024-01-01",
    ativo: true,
    tipos: [{ tipo: "FUNCIONARIO" }],
    ...overrides,
  };
}

export function makeEntidadeModel(overrides: Record<string, unknown> = {}) {
  const plain = makeEntidadePlain(overrides);

  return {
    ...plain,
    destroy: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue(plain),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

export function makeEntidadePayload(
  overrides: Partial<EntidadeInput> = {},
): EntidadeInput {
  return {
    nome: "João da Silva",
    cpf_cnpj: "12345678901",
    tipo_pessoa: "FISICA",
    participa_folha: true,
    ativo: true,
    tipos: ["FUNCIONARIO"],
    ...overrides,
  };
}
