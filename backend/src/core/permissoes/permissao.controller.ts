import { Request, Response } from "express";
import asyncHandler from "../../shared/middlewares/async-handler";
import PermissaoService from "./permissao.service";

class PermissaoController {
  listarPorUsuario = asyncHandler(async (req: Request, res: Response) => {
    const permissoes = await PermissaoService.listarPorUsuario(
      Number(req.params.id),
    );

    res.json({
      message: "Permissões listadas com sucesso.",
      data: permissoes,
    });
  });

  salvar = asyncHandler(async (req: Request, res: Response) => {
    const permissoes = await PermissaoService.salvar(
      Number(req.params.id),
      req.body.modulos,
      req.usuario,
      req.ip,
    );

    res.json({
      message: "Permissões atualizadas com sucesso.",
      data: permissoes,
    });
  });
}

export default new PermissaoController();
