import { Response } from "express";
import asyncHandler from "../../shared/middlewares/async-handler";
import AuditoriaService from "./auditoria.service";

class AuditoriaController {
  listar = asyncHandler(async (_req, res: Response) => {
    const auditorias = await AuditoriaService.listar();

    res.json({
      message: "Auditoria listada com sucesso.",
      data: auditorias,
    });
  });
}

export default new AuditoriaController();
