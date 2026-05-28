import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { CoreAuthClientService } from "./core-auth-client.service";

@Injectable()
export class EscritorioAuthGuard implements CanActivate {
  constructor(private readonly coreAuthClient: CoreAuthClientService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token de autenticacao nao informado.");
    }

    const token = authorization.replace("Bearer ", "").trim();
    request.user = await this.coreAuthClient.validarToken(token);
    return true;
  }
}
