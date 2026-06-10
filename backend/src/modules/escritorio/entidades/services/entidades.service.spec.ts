import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
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

  it("deve limpar RG e data de nascimento ao atualizar para pessoa juridica", async () => {
    const entidade = makeEntidadeModel();
    repository.buscarPorId
      .mockResolvedValueOnce(entidade)
      .mockResolvedValueOnce(makeEntidadeModel())
      .mockResolvedValueOnce(
        makeEntidadeModel({
          cpf_cnpj: "11222333000181",
          data_nascimento: null,
          rg: null,
          tipo_pessoa: "JURIDICA",
        }),
      );

    await service.atualizar(
      1,
      {
        cpf_cnpj: "11222333000181",
        data_nascimento: "1990-01-01",
        rg: "1234567",
        tipo_pessoa: "JURIDICA",
      },
      makeAuthContext(),
      "127.0.0.1",
    );

    expect(repository.atualizar).toHaveBeenCalledWith(
      entidade,
      expect.objectContaining({
        cpf_cnpj: "11222333000181",
        data_nascimento: null,
        rg: null,
        tipo_pessoa: "JURIDICA",
      }),
      transaction,
    );
  });

  it("deve rejeitar troca de tipo quando documento salvo nao e compativel", async () => {
    repository.buscarPorId
      .mockResolvedValueOnce(makeEntidadeModel())
      .mockResolvedValueOnce(makeEntidadeModel());

    await expect(
      service.atualizar(
        1,
        { tipo_pessoa: "JURIDICA" },
        makeAuthContext(),
        "127.0.0.1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction.rollback).toHaveBeenCalled();
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
