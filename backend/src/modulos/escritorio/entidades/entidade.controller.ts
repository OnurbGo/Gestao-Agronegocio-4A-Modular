import { Request, Response } from "express";
import asyncHandler from "../../../shared/middlewares/async-handler";
import EntidadeService from "./entidade.service";

class EntidadeController {
  criar = asyncHandler(async (req: Request, res: Response) => {
    const entidade = await EntidadeService.criar(req.body, req.usuario, req.ip);

    res.status(201).json({
      message: "Entidade cadastrada com sucesso.",
      data: entidade,
    });
  });

  listar = asyncHandler(async (req: Request, res: Response) => {
    const entidades = await EntidadeService.listar(req.query);

    res.json({
      message: "Entidades listadas com sucesso.",
      data: entidades,
    });
  });

  buscarPorId = asyncHandler(async (req: Request, res: Response) => {
    const entidade = await EntidadeService.buscarPorId(Number(req.params.id));

    res.json({
      message: "Entidade encontrada com sucesso.",
      data: entidade,
    });
  });

  atualizar = asyncHandler(async (req: Request, res: Response) => {
    const entidade = await EntidadeService.atualizar(
      Number(req.params.id),
      req.body,
      req.usuario,
      req.ip,
    );

    res.json({
      message: "Entidade atualizada com sucesso.",
      data: entidade,
    });
  });

  remover = asyncHandler(async (req: Request, res: Response) => {
    await EntidadeService.remover(Number(req.params.id), req.usuario, req.ip);

    res.json({
      message: "Entidade removida com sucesso.",
    });
  });
}

export default new EntidadeController();
