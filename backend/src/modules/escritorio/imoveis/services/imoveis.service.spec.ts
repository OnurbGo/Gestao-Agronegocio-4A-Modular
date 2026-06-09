import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuditService } from "../../auditoria/services/audit.service";
import { makeAuthContext } from "../../../../../test/helpers/auth.helper";
import { makeEntidadeModel } from "../../../../../test/factories/entidade.factory";
import {
  makeImovelModel,
  makeImovelPayload,
} from "../../../../../test/factories/imovel.factory";
import { ImoveisRepository } from "../repositories/imoveis.repository";
import { ImoveisService } from "./imoveis.service";

describe("ImoveisService", () => {
  let service: ImoveisService;
  let repository: {
    buscarEntidadesPorIds: jest.Mock;
    buscarPorId: jest.Mock;
    criar: jest.Mock;
    criarTransacao: jest.Mock;
    sincronizarProprietarios: jest.Mock;
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
      buscarEntidadesPorIds: jest.fn(),
      buscarPorId: jest.fn(),
      criar: jest.fn().mockResolvedValue({ id_imovel: 10 }),
      criarTransacao: jest.fn().mockResolvedValue(transaction),
      sincronizarProprietarios: jest.fn().mockResolvedValue(undefined),
    };
    auditService = {
      registrar: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ImoveisService,
        { provide: ImoveisRepository, useValue: repository },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = moduleRef.get(ImoveisService);
  });

  it("deve criar imóvel com proprietários válidos e remover IDs duplicados", async () => {
    repository.buscarEntidadesPorIds.mockResolvedValue([
      makeEntidadeModel({ id_entidade: 1 }),
      makeEntidadeModel({ id_entidade: 2 }),
    ]);
    repository.buscarPorId.mockResolvedValue(makeImovelModel({ id_imovel: 10 }));

    await service.criar(
      makeImovelPayload({ proprietarios_ids: [1, 1, 2] }),
      makeAuthContext(),
      "127.0.0.1",
    );

    expect(repository.buscarEntidadesPorIds).toHaveBeenCalledWith(
      [1, 2],
      transaction,
    );
    expect(repository.sincronizarProprietarios).toHaveBeenCalledWith(
      10,
      [1, 2],
      transaction,
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(auditService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "IMOVEL_CRIADO",
        recurso: "IMOVEL",
        recurso_id: 10,
      }),
    );
  });

  it("deve rejeitar vínculo com proprietário inexistente e fazer rollback", async () => {
    repository.buscarEntidadesPorIds.mockResolvedValue([
      makeEntidadeModel({ id_entidade: 1 }),
    ]);

    await expect(
      service.criar(
        makeImovelPayload({ proprietarios_ids: [1, 99] }),
        makeAuthContext(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(repository.criar).not.toHaveBeenCalled();
    expect(auditService.registrar).not.toHaveBeenCalled();
  });
});
