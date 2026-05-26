import { Router } from "express";
import auditoriaRoutes from "./auditoria/auditoria.routes";
import authRoutes from "./auth/auth.routes";
import permissaoRoutes from "./permissoes/permissao.routes";
import usuarioRoutes from "./usuarios/usuario.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/permissoes", permissaoRoutes);
router.use("/auditoria", auditoriaRoutes);

export default router;
