import { Router } from "express";
import entidadeRoutes from "./entidades/entidade.routes";

const router = Router();

router.use("/entidades", entidadeRoutes);

export default router;
