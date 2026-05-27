import { Request, Response } from "express";
import asyncHandler from "../../shared/middlewares/async-handler";
import UsuarioService from "./usuario.service";

class UsuarioController {
  criar = asyncHandler(async (req: Request, res: Response) => {
    const resultado = await UsuarioService.criar(req.body, req.ip);

    res.status(resultado.statusCode).json({
      message: resultado.message,
      data: resultado.data,
    });
  });

  listar = asyncHandler(async (_req: Request, res: Response) => {
    const usuarios = await UsuarioService.listar();

    res.json({
      message: "Usuários listados com sucesso.",
      data: usuarios,
    });
  });

  buscarPorId = asyncHandler(async (req: Request, res: Response) => {
    const usuario = await UsuarioService.buscarPorId(Number(req.params.id));

    res.json({
      message: "Usuário encontrado com sucesso.",
      data: usuario,
    });
  });

  atualizar = asyncHandler(async (req: Request, res: Response) => {
    const usuario = await UsuarioService.atualizar(
      Number(req.params.id),
      req.body,
      req.usuario,
      req.ip,
    );

    res.json({
      message: "Usuário atualizado com sucesso.",
      data: usuario,
    });
  });

  remover = asyncHandler(async (req: Request, res: Response) => {
    await UsuarioService.remover(Number(req.params.id), req.usuario, req.ip);

    res.json({
      message: "Usuário removido com sucesso.",
    });
  });

  listarSolicitacoes = asyncHandler(async (req: Request, res: Response) => {
    const solicitacoes = await UsuarioService.listarSolicitacoes(
      req.query.status as "PENDENTE" | "APROVADA" | "RECUSADA" | undefined,
    );

    res.json({
      message: "Solicitações listadas com sucesso.",
      data: solicitacoes,
    });
  });

  aprovarSolicitacao = asyncHandler(async (req: Request, res: Response) => {
    const usuario = await UsuarioService.aprovarSolicitacao(
      Number(req.params.id),
      req.body,
      req.usuario,
      req.ip,
    );

    res.json({
      message: "Solicitação aprovada com sucesso.",
      data: usuario,
    });
  });

  recusarSolicitacao = asyncHandler(async (req: Request, res: Response) => {
    const solicitacao = await UsuarioService.recusarSolicitacao(
      Number(req.params.id),
      req.body,
      req.usuario,
      req.ip,
    );

    res.json({
      message: "Solicitação recusada com sucesso.",
      data: solicitacao,
    });
  });
}

export default new UsuarioController();
