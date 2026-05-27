import { Router } from "express";
import validate from "../../../shared/middlewares/validate.middleware";
import authMiddleware from "../../../core/auth/auth.middleware";
import requireModulo from "../../../core/permissoes/require-modulo.middleware";
import EntidadeController from "./entidade.controller";
import {
  atualizarEntidadeSchema,
  entidadeIdParamSchema,
  entidadeSchema,
  listarEntidadesQuerySchema,
} from "./entidade.schema";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireModulo("ESCRITORIO", "visualizar"),
  validate({ query: listarEntidadesQuerySchema }),
  EntidadeController.listar,
);

router.post(
  "/",
  authMiddleware,
  requireModulo("ESCRITORIO", "criar"),
  validate(entidadeSchema),
  EntidadeController.criar,
);

router.get(
  "/:id",
  authMiddleware,
  requireModulo("ESCRITORIO", "visualizar"),
  validate({ params: entidadeIdParamSchema }),
  EntidadeController.buscarPorId,
);

router.put(
  "/:id",
  authMiddleware,
  requireModulo("ESCRITORIO", "editar"),
  validate({ params: entidadeIdParamSchema, body: atualizarEntidadeSchema }),
  EntidadeController.atualizar,
);

router.delete(
  "/:id",
  authMiddleware,
  requireModulo("ESCRITORIO", "excluir"),
  validate({ params: entidadeIdParamSchema }),
  EntidadeController.remover,
);

export default router;
