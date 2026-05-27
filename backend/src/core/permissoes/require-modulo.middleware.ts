import { NextFunction, Request, Response } from "express";
import ApiError from "../../shared/errors/api-error";
import UsuarioModulo from "../usuarios/usuario-modulo.model";
import {
  ACAO_CAMPO,
  AcaoPermissao,
  Modulo,
  PermissaoModulo,
} from "./modulo.enum";
import PermissaoService from "./permissao.service";

const requireModulo =
  (modulo: Modulo, acao: AcaoPermissao) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.usuario) {
        throw new ApiError("Autenticação obrigatória.", 401);
      }

      const permissoes = await UsuarioModulo.findAll({
        where: { usuario_id: req.usuario.id_usuario },
      });

      const modulos = permissoes.map(
        (permissao) => permissao.get({ plain: true }) as PermissaoModulo,
      );

      if (PermissaoService.possuiModulo(modulos, "ADMIN")) {
        return next();
      }

      if (modulo === "ADMIN") {
        throw new ApiError(
          "Você não tem permissão para executar esta ação.",
          403,
        );
      }

      if (
        PermissaoService.possuiModulo(modulos, "GERENTE") &&
        PermissaoService.gerentePodeAcessarModulo(modulo)
      ) {
        return next();
      }

      const permissao = modulos.find((item) => item.modulo === modulo);
      const campo = ACAO_CAMPO[acao];

      if (!permissao || !permissao[campo]) {
        throw new ApiError(
          "Você não tem permissão para executar esta ação.",
          403,
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };

export default requireModulo;
