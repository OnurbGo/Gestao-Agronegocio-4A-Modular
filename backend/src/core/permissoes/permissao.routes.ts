import { Router } from "express";
import validate from "../../shared/middlewares/validate.middleware";
import authMiddleware from "../auth/auth.middleware";
import {
  salvarPermissoesSchema,
  usuarioIdParamSchema,
} from "./permissao.schema";
import requireModulo from "./require-modulo.middleware";
import PermissaoController from "./permissao.controller";

const router = Router();

router.get(
  "/usuarios/:id",
  authMiddleware,
  requireModulo("GERENTE", "visualizar"),
  validate({ params: usuarioIdParamSchema }),
  PermissaoController.listarPorUsuario,
);

router.put(
  "/usuarios/:id",
  authMiddleware,
  requireModulo("GERENTE", "editar"),
  validate({ params: usuarioIdParamSchema, body: salvarPermissoesSchema }),
  PermissaoController.salvar,
);

export default router;
