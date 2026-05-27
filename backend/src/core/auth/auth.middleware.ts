import { NextFunction, Request, Response } from "express";
import ApiError from "../../shared/errors/api-error";
import UsuarioModulo from "../usuarios/usuario-modulo.model";
import Usuario from "../usuarios/usuario.model";
import { Modulo, PermissaoModulo } from "../permissoes/modulo.enum";
import TokenService from "./token.service";

const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new ApiError("Token de autenticação não informado.", 401);
    }

    const token = authorization.replace("Bearer ", "").trim();
    let payload;

    try {
      payload = TokenService.verificar(token);
    } catch {
      throw new ApiError("Token inválido ou expirado.", 401);
    }

    const usuario = await Usuario.findOne({
      where: {
        id_usuario: payload.id_usuario,
        ativo: true,
      },
    });

    if (!usuario) {
      throw new ApiError("Usuário não autenticado.", 401);
    }

    const modulos = await UsuarioModulo.findAll({
      where: { usuario_id: payload.id_usuario },
    });

    const permissoes = modulos.map(
      (permissao) => permissao.get({ plain: true }) as PermissaoModulo,
    );
    const modulosNomes = permissoes.map((permissao) => permissao.modulo);

    req.usuario = {
      id_usuario: usuario.get("id_usuario") as number,
      nome: usuario.get("nome") as string,
      email: usuario.get("email") as string,
      modulos: permissoes,
      possuiAdmin: modulosNomes.includes("ADMIN"),
      possuiGerente: modulosNomes.includes("GERENTE"),
      modulosNomes: modulosNomes as Modulo[],
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

export default authMiddleware;
