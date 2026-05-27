import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class OptionalCoreAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return true;
    }

    const token = authorization.replace("Bearer ", "").trim();
    try {
      request.user = await this.authService.validarToken(token);
    } catch {
      request.user = undefined;
    }

    return true;
  }
}
