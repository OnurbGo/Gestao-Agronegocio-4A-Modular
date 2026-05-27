import { Request, Response } from "express";
import asyncHandler from "../../shared/middlewares/async-handler";
import ApiError from "../../shared/errors/api-error";
import AuthService from "./auth.service";

class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const resultado = await AuthService.login(req.body, req.ip);

    res.json({
      message: "Login realizado com sucesso.",
      data: resultado,
    });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.usuario) {
      throw new ApiError("Autenticação obrigatória.", 401);
    }

    const usuario = await AuthService.me(req.usuario.id_usuario);

    res.json({
      message: "Usuário autenticado retornado com sucesso.",
      data: usuario,
    });
  });
}

export default new AuthController();
