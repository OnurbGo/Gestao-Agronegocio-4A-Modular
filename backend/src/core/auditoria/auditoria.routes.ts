import { Router } from "express";
import authMiddleware from "../auth/auth.middleware";
import requireModulo from "../permissoes/require-modulo.middleware";
import AuditoriaController from "./auditoria.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireModulo("ADMIN", "visualizar"),
  AuditoriaController.listar,
);

export default router;
