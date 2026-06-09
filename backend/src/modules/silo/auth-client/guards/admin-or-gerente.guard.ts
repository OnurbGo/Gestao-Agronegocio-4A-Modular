import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthContext } from "../types/auth.types";

@Injectable()
export class AdminOrGerenteGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthContext | undefined;

    if (!user) {
      throw new ForbiddenException("Contexto de usuario ausente.");
    }

    if (!user.possuiAdmin && !user.possuiGerente) {
      throw new ForbiddenException("Apenas ADMIN ou GERENTE pode executar esta acao.");
    }

    return true;
  }
}
