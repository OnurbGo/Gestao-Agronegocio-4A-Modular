import { Test } from "@nestjs/testing";
import { EntidadesService } from "./entidades.service";
import { EntidadesRepository } from "../repositories/entidades.repository";
import { AuditService } from "../../auditoria/services/audit.service";
import {
  makeEntidadeModel,
  makeEntidadePayload,
} from "../../../../../test/factories/entidade.factory";
import { makeAuthContext } from "../../../../../test/helpers/auth.helper";

describe("EntidadesService", () => {
  let service: EntidadesService;
  let repository: {
    atualizar: jest.Mock;
    buscarPorId: jest.Mock;
    criar: jest.Mock;
    criarTransacao: jest.Mock;
    listarPaginado: jest.Mock;
    substituirTipos: jest.Mock;
  };
  let auditService: {
    registrar: jest.Mock;
  };
  let transaction: {
    commit: jest.Mock;
    rollback: jest.Mock;
  };

  beforeEach(async () => {
    transaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    repository = {
      atualizar: jest.fn().mockResolvedValue(undefined),
      buscarPorId: jest.fn(),
      criar: jest.fn().mockResolvedValue({ id_entidade: 1 }),
      criarTransacao: jest.fn().mockResolvedValue(transaction),
      listarPaginado: jest.fn(),
      substituirTipos: jest.fn().mockResolvedValue(undefined),
    };
    auditService = {
      registrar: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EntidadesService,
        { provide: EntidadesRepository, useValue: repository },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = moduleRef.get(EntidadesService);
  });

  it("deve criar entidade válida, substituir tipos e auditar", async () => {
    repository.buscarPorId.mockResolvedValue(makeEntidadeModel());

    const result = await service.criar(
      makeEntidadePayload(),
      makeAuthContext(),
      "127.0.0.1",
    );

    expect(repository.criar).toHaveBeenCalledWith(
      expect.not.objectContaining({ tipos: expect.anything() }),
      transaction,
    );
    expect(repository.substituirTipos).toHaveBeenCalledWith(
      1,
      ["FUNCIONARIO"],
      transaction,
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(auditService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "ENTIDADE_CRIADA",
        recurso: "ENTIDADE",
        recurso_id: 1,
        valor_novo: expect.objectContaining({ id_entidade: 1 }),
      }),
    );
    expect(result).toMatchObject({ id_entidade: 1, tipos: ["FUNCIONARIO"] });
  });

  it("deve fazer soft delete e registrar auditoria ao remover", async () => {
    const entidade = makeEntidadeModel();
    repository.buscarPorId
      .mockResolvedValueOnce(entidade)
      .mockResolvedValueOnce(makeEntidadeModel());

    await service.remover(1, makeAuthContext(), "127.0.0.1");

    expect(entidade.update).toHaveBeenCalledWith({ ativo: false });
    expect(entidade.destroy).toHaveBeenCalled();
    expect(auditService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "ENTIDADE_REMOVIDA",
        recurso: "ENTIDADE",
        recurso_id: 1,
      }),
    );
  });
});
