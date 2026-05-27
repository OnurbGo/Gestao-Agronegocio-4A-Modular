import { Router } from "express";
import validate from "../../shared/middlewares/validate.middleware";
import authMiddleware from "../auth/auth.middleware";
import requireModulo from "../permissoes/require-modulo.middleware";
import {
  aprovarSolicitacaoSchema,
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  listarSolicitacoesQuerySchema,
  recusarSolicitacaoSchema,
  solicitacaoIdParamSchema,
} from "./usuario.schema";
import { usuarioIdParamSchema } from "../permissoes/permissao.schema";
import UsuarioController from "./usuario.controller";

const router = Router();

router.post("/", validate(criarUsuarioSchema), UsuarioController.criar);

router.get(
  "/solicitacoes",
  authMiddleware,
  requireModulo("GERENTE", "visualizar"),
  validate({ query: listarSolicitacoesQuerySchema }),
  UsuarioController.listarSolicitacoes,
);

router.patch(
  "/solicitacoes/:id/aprovar",
  authMiddleware,
  requireModulo("GERENTE", "editar"),
  validate({
    params: solicitacaoIdParamSchema,
    body: aprovarSolicitacaoSchema,
  }),
  UsuarioController.aprovarSolicitacao,
);

router.patch(
  "/solicitacoes/:id/recusar",
  authMiddleware,
  requireModulo("GERENTE", "editar"),
  validate({
    params: solicitacaoIdParamSchema,
    body: recusarSolicitacaoSchema,
  }),
  UsuarioController.recusarSolicitacao,
);

router.get(
  "/",
  authMiddleware,
  requireModulo("GERENTE", "visualizar"),
  UsuarioController.listar,
);

router.get(
  "/:id",
  authMiddleware,
  requireModulo("GERENTE", "visualizar"),
  validate({ params: usuarioIdParamSchema }),
  UsuarioController.buscarPorId,
);

router.put(
  "/:id",
  authMiddleware,
  requireModulo("GERENTE", "editar"),
  validate({ params: usuarioIdParamSchema, body: atualizarUsuarioSchema }),
  UsuarioController.atualizar,
);

router.delete(
  "/:id",
  authMiddleware,
  requireModulo("GERENTE", "excluir"),
  validate({ params: usuarioIdParamSchema }),
  UsuarioController.remover,
);

export default router;
