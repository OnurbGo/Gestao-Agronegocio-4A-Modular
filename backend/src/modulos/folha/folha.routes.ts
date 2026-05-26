import { Router } from "express";
import authMiddleware from "../../core/auth/auth.middleware";
import requireModulo from "../../core/permissoes/require-modulo.middleware";
import validate from "../../shared/middlewares/validate.middleware";
import FolhaController from "./folha.controller";
import {
  anoQuerySchema,
  feriasSchema,
  folhaMensalSchema,
  listarParticipantesQuerySchema,
  participanteIdParamSchema,
  registroSalarialSchema,
  relatorioMensalQuerySchema,
} from "./folha.schema";

const router = Router();

router.get(
  "/participantes",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ query: listarParticipantesQuerySchema }),
  FolhaController.listarParticipantes,
);

router.get(
  "/participantes/:id",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ params: participanteIdParamSchema }),
  FolhaController.buscarParticipante,
);

router.get(
  "/participantes/:id/registros-salariais",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ params: participanteIdParamSchema }),
  FolhaController.listarRegistrosSalariais,
);

router.post(
  "/participantes/:id/registros-salariais",
  authMiddleware,
  requireModulo("FOLHA", "criar"),
  validate({ params: participanteIdParamSchema, body: registroSalarialSchema }),
  FolhaController.criarRegistroSalarial,
);

router.get(
  "/participantes/:id/ferias",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ params: participanteIdParamSchema }),
  FolhaController.listarFerias,
);

router.post(
  "/participantes/:id/ferias",
  authMiddleware,
  requireModulo("FOLHA", "criar"),
  validate({ params: participanteIdParamSchema, body: feriasSchema }),
  FolhaController.criarFerias,
);

router.get(
  "/participantes/:id/lancamentos-mensais",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ params: participanteIdParamSchema, query: anoQuerySchema }),
  FolhaController.listarLancamentosMensais,
);

router.put(
  "/participantes/:id/lancamentos-mensais",
  authMiddleware,
  requireModulo("FOLHA", "editar"),
  validate({ params: participanteIdParamSchema, body: folhaMensalSchema }),
  FolhaController.salvarLancamentosMensais,
);

router.get(
  "/participantes/:id/lancamentos-mensais/exportar",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ params: participanteIdParamSchema, query: anoQuerySchema }),
  FolhaController.exportarLancamentosMensais,
);

router.get(
  "/relatorios/mensal",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ query: relatorioMensalQuerySchema }),
  FolhaController.relatorioMensal,
);

router.get(
  "/relatorios/mensal/exportar",
  authMiddleware,
  requireModulo("FOLHA", "visualizar"),
  validate({ query: relatorioMensalQuerySchema }),
  FolhaController.exportarRelatorioMensal,
);

export default router;
