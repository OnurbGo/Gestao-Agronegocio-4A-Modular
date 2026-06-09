import { Test } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { TokenService } from "./token.service";
import { AccountsRepository } from "../../contas/repositories/accounts.repository";
import { AuditService } from "../../auditoria/services/audit.service";
import { makeContaModel, makeModuloModel } from "../../../../test/factories/usuario.factory";

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
  },
}));

describe("AuthService", () => {
  let service: AuthService;
  let accountsRepository: {
    atualizarUltimoLogin: jest.Mock;
    buscarContaAtivaPorId: jest.Mock;
    buscarContaParaAutenticacaoPorEmail: jest.Mock;
  };
  let tokenService: {
    gerar: jest.Mock;
    verificar: jest.Mock;
  };
  let auditService: {
    registrar: jest.Mock;
  };
  const comparePassword = bcrypt.compare as jest.Mock;

  beforeEach(async () => {
    accountsRepository = {
      atualizarUltimoLogin: jest.fn().mockResolvedValue(undefined),
      buscarContaAtivaPorId: jest.fn(),
      buscarContaParaAutenticacaoPorEmail: jest.fn(),
    };
    tokenService = {
      gerar: jest.fn().mockReturnValue("jwt-token"),
      verificar: jest.fn(),
    };
    auditService = {
      registrar: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AccountsRepository, useValue: accountsRepository },
        { provide: TokenService, useValue: tokenService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    comparePassword.mockReset();
  });

  it("deve autenticar com credenciais válidas e registrar auditoria", async () => {
    const conta = makeContaModel({
      email: "admin@teste.local",
      modulos: [makeModuloModel({ modulo: "ADMIN" })],
    });
    accountsRepository.buscarContaParaAutenticacaoPorEmail.mockResolvedValue(conta);
    comparePassword.mockResolvedValue(true);

    const result = await service.login(
      { email: " ADMIN@TESTE.LOCAL ", senha: "senha-segura" },
      "127.0.0.1",
    );

    expect(accountsRepository.buscarContaParaAutenticacaoPorEmail).toHaveBeenCalledWith(
      "admin@teste.local",
    );
    expect(comparePassword).toHaveBeenCalledWith("senha-segura", conta.senha_hash);
    expect(accountsRepository.atualizarUltimoLogin).toHaveBeenCalledWith(1);
    expect(tokenService.gerar).toHaveBeenCalledWith({
      id_conta: 1,
      id_usuario: 1,
      email: "admin@teste.local",
    });
    expect(auditService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        acao: "LOGIN",
        conta_id: 1,
        ip: "127.0.0.1",
        recurso: "CONTA",
      }),
    );
    expect(result).toMatchObject({
      token: "jwt-token",
      usuario: {
        conta_id: 1,
        email: "admin@teste.local",
        possuiAdmin: true,
      },
    });
  });

  it("deve rejeitar senha inválida sem gerar token", async () => {
    accountsRepository.buscarContaParaAutenticacaoPorEmail.mockResolvedValue(
      makeContaModel(),
    );
    comparePassword.mockResolvedValue(false);

    await expect(
      service.login({ email: "admin@teste.local", senha: "errada" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(tokenService.gerar).not.toHaveBeenCalled();
    expect(auditService.registrar).not.toHaveBeenCalled();
  });

  it("deve rejeitar conta inativa", async () => {
    accountsRepository.buscarContaParaAutenticacaoPorEmail.mockResolvedValue(
      makeContaModel({ ativo: false }),
    );

    await expect(
      service.login({ email: "admin@teste.local", senha: "senha" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(comparePassword).not.toHaveBeenCalled();
  });

  it("deve validar token ativo e rejeitar token anterior à troca de senha", async () => {
    const senhaAlteradaEm = new Date("2024-01-02T00:00:00.000Z");
    tokenService.verificar.mockReturnValue({
      id_conta: 1,
      id_usuario: 1,
      email: "admin@teste.local",
      iat: Math.floor(new Date("2024-01-01T23:00:00.000Z").getTime() / 1000),
    });
    accountsRepository.buscarContaAtivaPorId.mockResolvedValue(
      makeContaModel({ senha_alterada_em: senhaAlteradaEm }),
    );

    await expect(service.validarToken("token-antigo")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
