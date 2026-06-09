import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AuditService } from "../../auditoria/services/audit.service";
import { makeAuthContext } from "../../../../../test/helpers/auth.helper";
import { makeEntidadeModel } from "../../../../../test/factories/entidade.factory";
import {
  makeRegistroSalarialModel,
  makeRegistroSalarialPayload,
} from "../../../../../test/factories/registro-salarial.factory";
import { makeFeriasPayload } from "../../../../../test/factories/ferias.factory";
import { FolhaRepository } from "../repositories/folha.repository";
import { FolhaService } from "./folha.service";

describe("FolhaService", () => {
  let service: FolhaService;
  let repository: {
    buscarFerias: jest.Mock;
    buscarLancamentoMensal: jest.Mock;
    buscarParticipante: jest.Mock;
    buscarRegistroSalarial: jest.Mock;
    buscarRegistrosSalariais: jest.Mock;
    criarFerias: jest.Mock;
    criarLancamentoMensal: jest.Mock;
    criarRegistroSalarial: jest.Mock;
    criarTransacao: jest.Mock;
    listarLancamentosMensais: jest.Mock;
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
      buscarFerias: jest.fn().mockResolvedValue([]),
      buscarLancamentoMensal: jest.fn().mockResolvedValue(null),
      buscarParticipante: jest.fn().mockResolvedValue(makeEntidadeModel()),
      buscarRegistroSalarial: jest.fn().mockResolvedValue(null),
      buscarRegistrosSalariais: jest.fn().mockResolvedValue([]),
      criarFerias: jest.fn(),
      criarLancamentoMensal: jest.fn().mockResolvedValue(undefined),
      criarRegistroSalarial: jest.fn(),
      criarTransacao: jest.fn().mockResolvedValue(transaction),
      listarLancamentosMensais: jest.fn().mockResolvedValue([]),
    };
    auditService = {
      registrar: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FolhaService,
        { provide: FolhaRepository, useValue: repository },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = moduleRef.get(FolhaService);
  });

  it("deve criar registro salarial válido e auditar", async () => {
    const registro = makeRegistroSalarialModel();
    repository.criarRegistroSalarial.mockResolvedValue(registro);

    const result = await service.criarRegistroSalarial(
      1,
      makeRegistroSalarialPayload(),
      makeAuthContext(),
      "127.0.0.1",
    );

    expect(repository.buscarParticipante).toHaveBeenCalledWith(1);
    expect(repository.buscarRegistroSalarial).toHaveBeenCalled();
    expect(repository.criarRegistroSalarial).toHaveBeenCalledWith(
      expect.objectContaining({
        entidade_id: 1,
        inicio_vigencia: "2024-01-01",
        salario: "3000.00",
      }),
      transaction,
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(auditService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "REGISTRO_SALARIAL_CRIADO",
        recurso: "FOLHA",
        recurso_id: 1,
      }),
    );
    expect(result).toMatchObject({ id_registro_salarial: 1 });
  });

  it("deve impedir registro salarial com fim anterior ao início", async () => {
    await expect(
      service.criarRegistroSalarial(
        1,
        makeRegistroSalarialPayload({
          inicio_vigencia: "2024-02-01",
          fim_vigencia: "2024-01-31",
        }),
        makeAuthContext(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.criarTransacao).not.toHaveBeenCalled();
  });

  it("deve impedir sobreposição de período salarial", async () => {
    repository.buscarRegistroSalarial.mockResolvedValue(makeRegistroSalarialModel());

    await expect(
      service.criarRegistroSalarial(
        1,
        makeRegistroSalarialPayload(),
        makeAuthContext(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(repository.criarRegistroSalarial).not.toHaveBeenCalled();
  });

  it("deve rejeitar férias sem registro salarial vigente no período", async () => {
    repository.buscarRegistrosSalariais.mockResolvedValue([]);

    await expect(
      service.criarFerias(1, makeFeriasPayload(), makeAuthContext()),
    ).rejects.toThrow(/registro salarial/i);

    expect(repository.criarTransacao).not.toHaveBeenCalled();
    expect(repository.criarFerias).not.toHaveBeenCalled();
  });
});
