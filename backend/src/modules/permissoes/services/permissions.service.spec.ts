import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AccountsEventsService } from "../../contas/services/accounts-events.service";
import { PermissionsRepository } from "../repositories/permissions.repository";
import { PermissionsService } from "./permissions.service";
import { makeAuthContext, makePermission } from "../../../../test/helpers/auth.helper";

describe("PermissionsService", () => {
  let service: PermissionsService;
  let repository: {
    buscarContaPorId: jest.Mock;
    contarAdminsAtivos: jest.Mock;
    criarTransacao: jest.Mock;
    listarPorConta: jest.Mock;
    substituirPorConta: jest.Mock;
  };
  let eventsService: {
    emitPermissionsUpdated: jest.Mock;
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
      buscarContaPorId: jest.fn().mockResolvedValue({ id_conta: 2, ativo: true }),
      contarAdminsAtivos: jest.fn().mockResolvedValue(2),
      criarTransacao: jest.fn().mockResolvedValue(transaction),
      listarPorConta: jest.fn().mockResolvedValue([]),
      substituirPorConta: jest.fn().mockResolvedValue(undefined),
    };
    eventsService = {
      emitPermissionsUpdated: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PermissionsRepository, useValue: repository },
        { provide: AccountsEventsService, useValue: eventsService },
      ],
    }).compile();

    service = moduleRef.get(PermissionsService);
  });

  it("deve impedir usuário comum de alterar permissões", async () => {
    await expect(
      service.salvar(
        2,
        { modulos: [makePermission({ modulo: "ESCRITORIO" })] },
        makeAuthContext({ possuiAdmin: false, possuiGerente: false, modulos: [] }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.buscarContaPorId).not.toHaveBeenCalled();
  });

  it("deve impedir GERENTE de alterar conta ADMIN ou GERENTE", async () => {
    repository.listarPorConta.mockResolvedValue([
      makePermission({ modulo: "ADMIN", pode_visualizar: true }),
    ]);

    await expect(
      service.salvar(
        2,
        { modulos: [makePermission({ modulo: "ESCRITORIO" })] },
        makeAuthContext({
          possuiAdmin: false,
          possuiGerente: true,
          modulos: [makePermission({ modulo: "GERENTE" })],
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.criarTransacao).not.toHaveBeenCalled();
  });

  it("deve impedir remover o último ADMIN ativo", async () => {
    repository.listarPorConta.mockResolvedValue([
      makePermission({ modulo: "ADMIN", pode_visualizar: true }),
    ]);
    repository.contarAdminsAtivos.mockResolvedValue(1);

    await expect(
      service.salvar(
        2,
        { modulos: [makePermission({ modulo: "ESCRITORIO" })] },
        makeAuthContext({ possuiAdmin: true }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction.rollback).toHaveBeenCalled();
    expect(eventsService.emitPermissionsUpdated).not.toHaveBeenCalled();
  });

  it("deve salvar permissões válidas e invalidar cache da conta", async () => {
    const modulos = [makePermission({ modulo: "ESCRITORIO" })];

    await service.salvar(2, { modulos }, makeAuthContext({ possuiAdmin: true }));

    expect(repository.substituirPorConta).toHaveBeenCalledWith(
      2,
      modulos,
      transaction,
    );
    expect(transaction.commit).toHaveBeenCalled();
    expect(eventsService.emitPermissionsUpdated).toHaveBeenCalledWith(2);
  });
});
