import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../services/auth.service";

@Injectable()
export class CoreAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token de autenticacao nao informado.");
    }

    const token = authorization.replace("Bearer ", "").trim();
    request.user = await this.authService.validarToken(token);
    return true;
  }
}

