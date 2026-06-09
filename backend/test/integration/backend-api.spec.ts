import { BadRequestException, Module, UnauthorizedException } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { AuthController } from "../../src/modules/auth/controllers/auth.controller";
import { CoreAuthGuard } from "../../src/modules/auth/guards/core-auth.guard";
import { AuthService } from "../../src/modules/auth/services/auth.service";
import { CoreAuthClientService } from "../../src/modules/escritorio/auth-client/services/core-auth-client.service";
import { EscritorioAuthGuard } from "../../src/modules/escritorio/auth-client/guards/escritorio-auth.guard";
import { PermissionGuard } from "../../src/modules/escritorio/auth-client/guards/permission.guard";
import { EntidadesController } from "../../src/modules/escritorio/entidades/controllers/entidades.controller";
import { EntidadesService } from "../../src/modules/escritorio/entidades/services/entidades.service";
import { FolhaController } from "../../src/modules/escritorio/folha/controllers/folha.controller";
import { FolhaService } from "../../src/modules/escritorio/folha/services/folha.service";
import { ImoveisController } from "../../src/modules/escritorio/imoveis/controllers/imoveis.controller";
import { ImoveisService } from "../../src/modules/escritorio/imoveis/services/imoveis.service";
import { makeEntidadePayload } from "../factories/entidade.factory";
import { makeFeriasPayload } from "../factories/ferias.factory";
import { makeImovelPayload } from "../factories/imovel.factory";
import { makeRegistroSalarialPayload } from "../factories/registro-salarial.factory";
import { authHeader, makeAuthContext } from "../helpers/auth.helper";
import { expectMessageContaining } from "../helpers/assertions.helper";
import { createHttpTestApp } from "../test-app";

@Module({})
class CoreTestingModule {}

@Module({})
class EscritorioTestingModule {}

describe("Backend API integration", () => {
  let app: INestApplication;
  let authService: {
    login: jest.Mock;
    validarToken: jest.Mock;
  };
  let coreAuthClient: {
    validarToken: jest.Mock;
  };
  let entidadesService: Record<string, jest.Mock>;
  let imoveisService: Record<string, jest.Mock>;
  let folhaService: Record<string, jest.Mock>;

  beforeEach(async () => {
    const admin = makeAuthContext();
    const semPermissao = makeAuthContext({
      conta_id: 3,
      usuario_id: 3,
      email: "comum@teste.local",
      modulos: [],
      possuiAdmin: false,
      possuiGerente: false,
    });
    const byToken = new Map([
      ["admin-token", admin],
      ["sem-permissao-token", semPermissao],
    ]);

    authService = {
      login: jest.fn().mockResolvedValue({
        token: "admin-token",
        usuario: admin,
      }),
      validarToken: jest.fn().mockImplementation((token: string) => {
        const user = byToken.get(token);
        if (!user) {
          throw new UnauthorizedException("Token inválido ou expirado.");
        }
        return user;
      }),
    };
    coreAuthClient = {
      validarToken: jest.fn().mockImplementation((token: string) => {
        const user = byToken.get(token);
        if (!user) {
          throw new UnauthorizedException("Token inválido ou conta inativa.");
        }
        return user;
      }),
    };
    entidadesService = {
      atualizar: jest.fn().mockResolvedValue({ id_entidade: 1 }),
      buscarPorId: jest.fn().mockResolvedValue({ id_entidade: 1 }),
      criar: jest.fn().mockResolvedValue({ id_entidade: 1 }),
      listar: jest.fn().mockResolvedValue({
        items: [{ id_entidade: 1 }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      }),
      remover: jest.fn().mockResolvedValue(undefined),
    };
    imoveisService = {
      atualizar: jest.fn().mockResolvedValue({ id_imovel: 1 }),
      buscarPorId: jest.fn().mockResolvedValue({ id_imovel: 1 }),
      criar: jest.fn().mockResolvedValue({ id_imovel: 1 }),
      listar: jest.fn().mockResolvedValue({
        items: [{ id_imovel: 1 }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      }),
      remover: jest.fn().mockResolvedValue(undefined),
    };
    folhaService = {
      atualizarFerias: jest.fn().mockResolvedValue({ id_ferias: 1 }),
      atualizarRegistroSalarial: jest
        .fn()
        .mockResolvedValue({ id_registro_salarial: 1 }),
      buscarParticipante: jest.fn().mockResolvedValue({ id_entidade: 1 }),
      criarFerias: jest.fn().mockResolvedValue({ id_ferias: 1 }),
      criarRegistroSalarial: jest
        .fn()
        .mockResolvedValue({ id_registro_salarial: 1 }),
      listarFerias: jest.fn().mockResolvedValue({
        items: [{ id_ferias: 1 }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        summary: { total_dias_gozados: 10 },
      }),
      listarParticipantes: jest.fn().mockResolvedValue({
        items: [{ id_entidade: 1 }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      }),
      listarRegistrosSalariais: jest.fn().mockResolvedValue({
        items: [{ id_registro_salarial: 1 }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      }),
      relatorioMensal: jest.fn().mockResolvedValue({ itens: [] }),
      removerFerias: jest.fn().mockResolvedValue(undefined),
      removerRegistroSalarial: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [
        {
          module: CoreTestingModule,
          controllers: [AuthController],
          providers: [
            CoreAuthGuard,
            { provide: AuthService, useValue: authService },
          ],
        },
        {
          module: EscritorioTestingModule,
          controllers: [
            EntidadesController,
            FolhaController,
            ImoveisController,
          ],
          providers: [
            EscritorioAuthGuard,
            PermissionGuard,
            { provide: CoreAuthClientService, useValue: coreAuthClient },
            { provide: EntidadesService, useValue: entidadesService },
            { provide: FolhaService, useValue: folhaService },
            { provide: ImoveisService, useValue: imoveisService },
          ],
        },
        RouterModule.register([
          { path: "core", module: CoreTestingModule },
          { path: "escritorio", module: EscritorioTestingModule },
        ]),
      ],
    }).compile();

    app = await createHttpTestApp(moduleFixture);
  });

  afterEach(async () => {
    await app.close();
  });

  describe("Auth", () => {
    it("POST /api/core/auth/login deve autenticar com sucesso", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/core/auth/login")
        .send({ email: "admin@teste.local", senha: "senha-segura" })
        .expect(201);

      expect(authService.login).toHaveBeenCalledWith(
        { email: "admin@teste.local", senha: "senha-segura" },
        expect.any(String),
      );
      expect(response.body.token).toBe("admin-token");
    });

    it("POST /api/core/auth/login deve retornar 401 para senha inválida", async () => {
      authService.login.mockRejectedValueOnce(
        new UnauthorizedException("E-mail ou senha inválidos."),
      );

      const response = await request(app.getHttpServer())
        .post("/api/core/auth/login")
        .send({ email: "admin@teste.local", senha: "errada" })
        .expect(401);

      expectMessageContaining(response.body, "E-mail ou senha");
    });

    it("GET /api/core/auth/me deve bloquear requisição sem token", async () => {
      await request(app.getHttpServer()).get("/api/core/auth/me").expect(401);
    });

    it("GET /api/core/auth/me deve aceitar token válido", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/core/auth/me")
        .set(authHeader())
        .expect(200);

      expect(response.body).toMatchObject({ conta_id: 1, possuiAdmin: true });
    });
  });

  describe("Entidades", () => {
    it("deve criar, listar, buscar, editar e remover entidade", async () => {
      await request(app.getHttpServer())
        .post("/api/escritorio/entidades")
        .set(authHeader())
        .send(makeEntidadePayload())
        .expect(201);

      await request(app.getHttpServer())
        .get("/api/escritorio/entidades")
        .set(authHeader())
        .expect(200);

      await request(app.getHttpServer())
        .get("/api/escritorio/entidades/1")
        .set(authHeader())
        .expect(200);

      await request(app.getHttpServer())
        .put("/api/escritorio/entidades/1")
        .set(authHeader())
        .send({ nome: "João Atualizado" })
        .expect(200);

      await request(app.getHttpServer())
        .delete("/api/escritorio/entidades/1")
        .set(authHeader())
        .expect(200);

      expect(entidadesService.criar).toHaveBeenCalled();
      expect(entidadesService.remover).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ conta_id: 1 }),
        expect.any(String),
      );
    });

    it("deve retornar 400 para payload inválido de entidade", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/escritorio/entidades")
        .set(authHeader())
        .send({ nome: "A", cpf_cnpj: "123", tipo_pessoa: "FISICA", tipos: [] })
        .expect(400);

      expectMessageContaining(response.body, "nome");
      expect(entidadesService.criar).not.toHaveBeenCalled();
    });

    it("deve retornar 403 quando usuário não tem permissão de criação", async () => {
      await request(app.getHttpServer())
        .post("/api/escritorio/entidades")
        .set(authHeader("sem-permissao-token"))
        .send(makeEntidadePayload())
        .expect(403);

      expect(entidadesService.criar).not.toHaveBeenCalled();
    });
  });

  describe("Imóveis", () => {
    it("deve criar, listar, editar e remover imóvel", async () => {
      await request(app.getHttpServer())
        .post("/api/escritorio/imoveis")
        .set(authHeader())
        .send(makeImovelPayload())
        .expect(201);

      await request(app.getHttpServer())
        .get("/api/escritorio/imoveis")
        .set(authHeader())
        .expect(200);

      await request(app.getHttpServer())
        .put("/api/escritorio/imoveis/1")
        .set(authHeader())
        .send({ nome: "Fazenda Atualizada", proprietarios_ids: [1] })
        .expect(200);

      await request(app.getHttpServer())
        .delete("/api/escritorio/imoveis/1")
        .set(authHeader())
        .expect(200);

      expect(imoveisService.criar).toHaveBeenCalled();
      expect(imoveisService.remover).toHaveBeenCalled();
    });

    it("deve retornar erro claro para proprietário inexistente", async () => {
      imoveisService.criar.mockRejectedValueOnce(
        new BadRequestException("Proprietario(s) nao encontrado(s): 999."),
      );

      const response = await request(app.getHttpServer())
        .post("/api/escritorio/imoveis")
        .set(authHeader())
        .send(makeImovelPayload({ proprietarios_ids: [999] }))
        .expect(400);

      expectMessageContaining(response.body, "Proprietario");
    });
  });

  describe("Folha", () => {
    it("deve criar, listar, editar e excluir registros salariais", async () => {
      await request(app.getHttpServer())
        .post("/api/escritorio/folha/participantes/1/registros-salariais")
        .set(authHeader())
        .send(makeRegistroSalarialPayload())
        .expect(201);

      await request(app.getHttpServer())
        .get("/api/escritorio/folha/participantes/1/registros-salariais")
        .set(authHeader())
        .expect(200);

      await request(app.getHttpServer())
        .put("/api/escritorio/folha/participantes/1/registros-salariais/1")
        .set(authHeader())
        .send(makeRegistroSalarialPayload({ salario: 3200 }))
        .expect(200);

      await request(app.getHttpServer())
        .delete("/api/escritorio/folha/participantes/1/registros-salariais/1")
        .set(authHeader())
        .expect(200);

      expect(folhaService.criarRegistroSalarial).toHaveBeenCalled();
      expect(folhaService.removerRegistroSalarial).toHaveBeenCalled();
    });

    it("deve retornar 400 ao tentar criar férias sem registro salarial", async () => {
      folhaService.criarFerias.mockRejectedValueOnce(
        new BadRequestException(
          "Não existe registro salarial para o período informado.",
        ),
      );

      const response = await request(app.getHttpServer())
        .post("/api/escritorio/folha/participantes/1/ferias")
        .set(authHeader())
        .send(makeFeriasPayload())
        .expect(400);

      expectMessageContaining(response.body, "registro salarial");
    });

    it("deve criar, listar, editar e excluir férias válidas", async () => {
      await request(app.getHttpServer())
        .post("/api/escritorio/folha/participantes/1/ferias")
        .set(authHeader())
        .send(makeFeriasPayload())
        .expect(201);

      await request(app.getHttpServer())
        .get("/api/escritorio/folha/participantes/1/ferias")
        .set(authHeader())
        .expect(200);

      await request(app.getHttpServer())
        .put("/api/escritorio/folha/participantes/1/ferias/1")
        .set(authHeader())
        .send(makeFeriasPayload({ valor_abono: 100 }))
        .expect(200);

      await request(app.getHttpServer())
        .delete("/api/escritorio/folha/participantes/1/ferias/1")
        .set(authHeader())
        .expect(200);

      expect(folhaService.criarFerias).toHaveBeenCalled();
      expect(folhaService.removerFerias).toHaveBeenCalled();
    });
  });
});
