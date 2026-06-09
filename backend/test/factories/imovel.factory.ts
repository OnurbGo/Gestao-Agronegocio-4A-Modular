import type { ImovelInput } from "../../src/modules/escritorio/imoveis/dto/imoveis.dto";

export function makeImovelPlain(overrides: Record<string, unknown> = {}) {
  return {
    id_imovel: 1,
    nome: "Fazenda Modelo",
    codigo: "FAZ-001",
    municipio: "Cascavel",
    ativo: true,
    proprietarios: [],
    ...overrides,
  };
}

export function makeImovelModel(overrides: Record<string, unknown> = {}) {
  const plain = makeImovelPlain(overrides);

  return {
    ...plain,
    destroy: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue(plain),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

export function makeImovelPayload(
  overrides: Partial<ImovelInput> = {},
): ImovelInput {
  return {
    nome: "Fazenda Modelo",
    codigo: "FAZ-001",
    municipio: "Cascavel",
    proprietarios_ids: [1],
    area_total: 120,
    ativo: true,
    ...overrides,
  };
}
