import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  PERMISSION_METADATA,
  RequiredPermission,
} from "../decorators/require-permission.decorator";
import { AuthContext } from "../types/auth.types";

const ACAO_CAMPO: Record<RequiredPermission["acao"], string> = {
  visualizar: "pode_visualizar",
  criar: "pode_criar",
  editar: "pode_editar",
  excluir: "pode_excluir",
  restaurar: "pode_restaurar",
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthContext | undefined;

    if (!user) {
      throw new ForbiddenException("Contexto de usuario ausente.");
    }

    if (user.possuiAdmin || user.possuiGerente) {
      return true;
    }

    const permissao = user.modulos.find((item) => item.modulo === required.modulo);
    const campo = ACAO_CAMPO[required.acao] as keyof typeof permissao;

    if (!permissao || !permissao[campo]) {
      throw new ForbiddenException("Voce nao tem permissao para esta acao.");
    }

    return true;
  }
}

